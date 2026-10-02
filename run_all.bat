@echo off
echo ======================================================================
echo  TASK 4: CODE REFACTORING AND PERFORMANCE OPTIMIZATION AUTOMATION
echo ======================================================================
echo.

echo [1/3] Running Functional Parity Tests...
node tests/parity.test.js
if %errorlevel% neq 0 (
    echo [ERROR] Parity tests failed! Aborting.
    exit /b %errorlevel%
)
echo.

echo [2/3] Executing Performance Benchmark Suite...
node benchmarks/run_benchmarks.js
if %errorlevel% neq 0 (
    echo [ERROR] Benchmark execution failed!
    exit /b %errorlevel%
)
echo.

echo [3/3] Opening Visual Benchmark Dashboard in Default Browser...
start "" "docs\report_dashboard.html"
echo.
echo ======================================================================
echo  EXECUTION COMPLETE: All tests passed & benchmarks recorded!
echo  Deliverable Report: docs\REFACTORING_REPORT.md
echo  Visual Dashboard:   docs\report_dashboard.html
echo ======================================================================
pause
