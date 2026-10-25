import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from opportunity_discovery import search_live_opportunities


SOURCE_URL = "https://www.gov.za/example-youth-learnership"


def fake_response(text, source_url=SOURCE_URL, source_title="Official youth programme"):
    chunk = SimpleNamespace(web=SimpleNamespace(uri=source_url, title=source_title))
    metadata = SimpleNamespace(
        grounding_chunks=[chunk],
        web_search_queries=["youth learnership South Africa 2026"],
        search_entry_point=SimpleNamespace(rendered_content="<div>Google Search suggestions</div>"),
    )
    candidate = SimpleNamespace(grounding_metadata=metadata)
    return SimpleNamespace(text=text, candidates=[candidate])


class OpportunityDiscoveryTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(
            os.environ,
            {
                "SYLVIA_LIVE_OPPORTUNITY_SEARCH_ENABLED": "true",
                "SYLVIA_SEARCH_MODEL": "gemini-test-model",
                "GOOGLE_CLOUD_PROJECT": "test-project",
            },
            clear=False,
        )
        self.env.start()
        self.addCleanup(self.env.stop)

    @patch("opportunity_discovery._generate_grounded_response")
    @patch("opportunity_discovery._build_client")
    def test_returns_only_opportunities_cited_by_grounding_metadata(self, build_client, generate):
        build_client.return_value = object()
        generate.return_value = fake_response(
            '{"summary":"One relevant lead.","opportunities":['
            '{"title":"Youth Learnership","summary":"A learnership for eligible applicants.",'
            '"opportunity_type":"learnership","location":"South Africa",'
            '"source_url":"https://www.gov.za/example-youth-learnership",'
            '"application_url":"https://www.gov.za/example-youth-learnership"},'
            '{"title":"Invented Listing","summary":"This must be rejected.",'
            '"opportunity_type":"job","source_url":"https://fake.example/not-grounded"}'
            ']}'
        )

        result = search_live_opportunities("youth learnership", "South Africa", limit=6)

        self.assertTrue(result["success"])
        self.assertEqual(result["status"], "results_found")
        self.assertEqual(len(result["opportunities"]), 1)
        opportunity = result["opportunities"][0]
        self.assertEqual(opportunity["source_url"], SOURCE_URL)
        self.assertEqual(opportunity["verification_status"], "search_result_only")
        self.assertFalse(opportunity["page_checked"])
        self.assertEqual(opportunity["availability_status"], "unknown")
        self.assertEqual(opportunity["application_url"], SOURCE_URL)
        self.assertTrue(result["last_checked_at"].endswith("Z"))
        self.assertEqual(result["discarded_items_without_grounded_source"], 1)
        self.assertIn("Google Search suggestions", result["search_entry_point_html"])

    @patch("opportunity_discovery._generate_grounded_response")
    @patch("opportunity_discovery._build_client")
    def test_search_sources_are_returned_even_when_json_is_malformed(self, build_client, generate):
        build_client.return_value = object()
        generate.return_value = fake_response("I found a source but could not safely structure the results.")

        result = search_live_opportunities("entry level jobs", "Durban, KwaZulu-Natal")

        self.assertTrue(result["success"])
        self.assertEqual(result["status"], "sources_found_structuring_failed")
        self.assertEqual(result["opportunities"], [])
        self.assertEqual(result["sources"][0]["url"], SOURCE_URL)

    def test_disabled_search_does_not_call_google(self):
        with patch.dict(os.environ, {"SYLVIA_LIVE_OPPORTUNITY_SEARCH_ENABLED": "false"}):
            with patch("opportunity_discovery._build_client") as build_client:
                result = search_live_opportunities("graduate jobs")
        build_client.assert_not_called()
        self.assertFalse(result["success"])
        self.assertEqual(result["status"], "disabled")

    def test_rejects_empty_or_short_queries(self):
        result = search_live_opportunities("  ")
        self.assertFalse(result["success"])
        self.assertEqual(result["status"], "invalid_query")

    @patch.dict(os.environ, {"GOOGLE_CLOUD_PROJECT": "", "GCP_PROJECT": "", "GCLOUD_PROJECT": "", "GEMINI_API_KEY": ""})
    def test_missing_credentials_returns_configuration_error(self):
        result = search_live_opportunities("youth employment")
        self.assertFalse(result["success"])
        self.assertEqual(result["status"], "configuration_error")
        self.assertEqual(result["opportunities"], [])


if __name__ == "__main__":
    unittest.main(verbosity=2)
