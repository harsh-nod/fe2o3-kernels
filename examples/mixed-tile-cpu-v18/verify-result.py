#!/usr/bin/env python3
"""Check fresh CLI output for the tutorial's fixed, independently checked input."""
import json
import pathlib
import sys


def require(condition, message):
    if not condition:
        raise ValueError(message)


def verify(inventory, request, result, retained_request, retained_result):
    require(request["kernel"] == inventory["kernels"][0]["id"], "fresh kernel binding")
    without_kernel = lambda value: {key: item for key, item in value.items() if key != "kernel"}
    require(without_kernel(request) == without_kernel(retained_request), "fixed input corpus")
    require(result["schema"] == "fe2o3-simulation-result-v1", "result schema")
    require(result["status"] == "ok", "simulation status")
    require(result["authority"] == "observation_only" and result["simulated"] is True,
            "CPU observation authority")
    for flag in ("hardware_observed", "hardware_validation", "performance_prediction"):
        require(result[flag] is False, flag)
    require(result["kir"] == {
        "sha256": inventory["kir"]["identity_sha256"],
        "canonical_bytes": inventory["kir"]["canonical_bytes"],
    }, "fresh canonical identity")
    require(result["target_profile"] == retained_result["target_profile"], "CPU target profile")
    require(result["arguments"] == request["arguments"], "argument views")
    require(result["schedule"]["coverage"]["complete"] is True, "complete simulation")
    expected = {row["id"]: row["buffer"] for row in retained_result["shared_buffers"]}
    observed = {row["id"]: row["buffer"] for row in result["shared_buffers"]}
    require(len(expected) == len(retained_result["shared_buffers"]), "retained duplicate backing")
    require(len(observed) == len(result["shared_buffers"]), "fresh duplicate backing")
    require(observed == expected, "exact input/output bytes and initialization")


if __name__ == "__main__":
    if len(sys.argv) != 6:
        raise SystemExit("usage: verify-result.py INVENTORY REQUEST RESULT RETAINED_REQUEST RETAINED_RESULT")
    documents = [json.loads(pathlib.Path(path).read_text()) for path in sys.argv[1:]]
    verify(*documents)
    print("PASS fixed-input CPU bytes, initialization, canaries and fresh canonical binding")
