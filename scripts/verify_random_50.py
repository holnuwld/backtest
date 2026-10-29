"""
scripts/verify_random_50.py
Runs the 50-run random backtest stress test via Node.js and prints a comprehensive mechanical verification report.
"""

import json
import subprocess
import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

def run_verification():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(script_dir, ".."))
    js_script = os.path.join(script_dir, "run_random_50.js")

    print("=" * 90)
    print("🚀 [MECHANICAL VERIFICATION] Running 50 Random Backtest Stress Test Cases...")
    print("=" * 90)

    try:
        proc = subprocess.run(
            ["node", js_script],
            cwd=project_root,
            capture_output=True,
            text=True,
            check=True
        )
        data = json.loads(proc.stdout)
    except subprocess.CalledProcessError as e:
        print(f"❌ Execution failed with code {e.returncode}")
        print("Stderr:", e.stderr)
        print("Stdout:", e.stdout)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Failed to parse JSON output: {e}")
        sys.exit(1)

    runs = data.get("runs", [])
    total = data.get("total", 0)
    passed = data.get("passed", 0)
    failed = data.get("failed", 0)
    pass_rate = data.get("passRate", "0%")

    print(f"\n총 테스트 케이스: {total}건 | 성공: {passed}건 | 실패: {failed}건 | 통과율: {pass_rate}\n")
    print("-" * 115)
    print(f"{'No':<4} | {'Period':<21} | {'Allocations':<24} | {'CAGR(%)':<8} | {'MDD(%)':<8} | {'Trades':<6} | {'Top5':<5} | {'Yearly':<6} | {'Status'}")
    print("-" * 115)

    for r in runs:
        run_id = f"#{r['runId']}"
        period = f"{r['startDate'][:7]}~{r['endDate'][:7]}"
        allocs = r['allocations']
        if len(allocs) > 22:
            allocs = allocs[:20] + ".."
        cagr = f"{r['cagr']:+.1f}%" if r['cagr'] is not None else "N/A"
        mdd = f"{r['mdd']:.1f}%" if r['mdd'] is not None else "N/A"
        trades = str(r['tradesCount'])
        top5 = f"{r['topDrawdownsCount']}건"
        yearly = f"{r['yearlyCount']}년"
        status = "✅ PASS" if r['pass'] else f"❌ FAIL ({r.get('error')})"

        print(f"{run_id:<4} | {period:<21} | {allocs:<24} | {cagr:<8} | {mdd:<8} | {trades:<6} | {top5:<5} | {yearly:<6} | {status}")

    print("-" * 115)
    print(f"📊 최종 판정: {passed}/{total} ALL PASS ({pass_rate})")
    print("=" * 115)

    if failed > 0:
        sys.exit(1)
    else:
        sys.exit(0)

if __name__ == "__main__":
    run_verification()
