#!/usr/bin/env python3
"""Select captured inputs by an explicit evidence format, not by file counts."""
import argparse
import hashlib
import json
from pathlib import Path
import re

LIMIT = 8 * 1024 * 1024


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read(path):
    require(path.is_file() and not path.is_symlink(), "nonregular capture file")
    require(path.stat().st_size <= LIMIT, "capture file exceeds bound")
    with path.open("rb") as source:
        data = source.read(LIMIT + 1)
    require(0 < len(data) <= LIMIT, "empty or oversized capture file")
    return data


def select(directory, order, head, receipt_path=None):
    require(order in ("blocked", "striped"), "unknown observation order")
    require(re.fullmatch(r"[0-9a-f]{40}", head) is not None, "invalid compiler revision")
    root = directory.resolve(strict=True)
    require(root.is_dir() and "\n" not in str(root), "invalid capture directory")
    summary = json.loads(read(root / "summary.json"))
    require(summary["authority"] == "observation_only", "invalid summary authority")
    for key in ("hardware_observed", "performance_prediction", "fixture_source_injection"):
        require(summary[key] is False, "invalid summary " + key)
    if receipt_path is None:
        require(summary["schema"] == "fe2o3-v18-public-example-cli-smoke-v1",
                "production captures require their collector receipt")
        require(summary["source_head"] == head, "historical compiler revision differs")
        paths = [root / (order + "-case-debug." + suffix) for suffix in ("request.json", "result.json")]
        for path in paths:
            read(path)
        return paths

    require(summary["schema"] == "fe2o3-scoped-tile-cli-test-v1", "invalid production summary schema")
    require(summary["full_simt_tile_pair_qualified"] is False, "invalid native pair claim")
    sessions = summary["debugger_sessions"]
    require(isinstance(sessions, list) and len(sessions) == 2
            and {row["order"] for row in sessions} == {"blocked", "striped"},
            "ambiguous debugger sessions")
    for row in sessions:
        require(row["complete"] is True and type(row["commands"]) is int and row["commands"] > 0,
                "incomplete debugger session")
    receipt = json.loads(read(receipt_path))
    require(receipt["schema"] == "fe2o3-task-ordinary-cpu-cli-archive-v1"
            and receipt["authority"] == "none", "invalid collector format")
    require(receipt["actualStage"]["exit"] == 0 and type(receipt["actualStage"]["exit"]) is int,
            "unsuccessful CPU stage")
    for key in ("sourceMeasurementBeforeCollection", "sourceMeasurementAfterCollection"):
        require(receipt[key]["head"] == head, "collector compiler revision differs")
    require(receipt["summary"] == summary, "collector summary differs")
    entries = receipt["debuggerEvidence"]
    require(isinstance(entries, list) and len(entries) == 2
            and {entry["order"] for entry in entries} == {"blocked", "striped"},
            "ambiguous debugger evidence")
    entry = next(entry for entry in entries if entry["order"] == order)
    require(entry["selection"]["sourceHead"] == head
            and entry["selection"]["kind"] == "frozen-production-test-case-ordinal",
            "debugger selection provenance differs")
    roster = receipt["archiveRoster"]
    require(isinstance(roster, list)
            and len({item["path"] for item in roster}) == len(roster), "ambiguous archive roster")
    indexed = {item["path"]: item for item in roster}
    paths = []
    for role in ("request", "result"):
        item = entry["files"][role]
        name = item["path"]
        require(isinstance(name, str) and re.fullmatch(r"[A-Za-z0-9_.-]+", name) is not None
                and name not in (".", ".."), "noncanonical mapped filename")
        require(indexed.get(name) == item, "mapped file is absent from collector roster")
        data = read(root / name)
        require(type(item["bytes"]) is int and item["bytes"] == len(data)
                and hashlib.sha256(data).hexdigest() == item["sha256"], "mapped capture hash differs")
        paths.append(root / name)
    require(paths[0] != paths[1], "request and result map to the same file")
    return paths


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    parser.add_argument("order")
    parser.add_argument("compiler_head")
    parser.add_argument("--receipt", type=Path)
    args = parser.parse_args()
    try:
        for selected in select(args.directory, args.order, args.compiler_head, args.receipt):
            print(selected)
    except (ValueError, KeyError, TypeError, OSError) as error:
        raise SystemExit("capture preflight: " + str(error)) from error
