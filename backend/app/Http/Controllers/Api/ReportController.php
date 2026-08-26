<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    /**
     * List all reports — admin only.
     */
    public function index(): JsonResponse
    {
        $reports = Report::with([
            'reporter:id,name,email,role',
            'reportedUser:id,name,email,role',
        ])
            ->latest()
            ->paginate(25);

        return response()->json(['reports' => $reports]);
    }

    /**
     * A client or technician submits a new report.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reported_user_id' => ['nullable', 'exists:users,id'],
            'type'             => ['required', 'in:inappropriate_behavior,fake_profile,payment_issue,no_show,safety_concern,other'],
            'description'      => ['required', 'string', 'max:2000'],
        ]);

        $report = Report::create([
            ...$data,
            'reporter_id' => $request->user()->id,
        ]);

        return response()->json(['report' => $report], 201);
    }

    /**
     * Admin resolves or updates a report's status.
     */
    public function resolve(Request $request, Report $report): JsonResponse
    {
        $data = $request->validate([
            'status'      => ['required', 'in:open,under_review,resolved'],
            'admin_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $report->update([
            ...$data,
            'resolved_at' => $data['status'] === 'resolved' ? now() : null,
        ]);

        return response()->json(['report' => $report->load(['reporter:id,name,email', 'reportedUser:id,name,email'])]);
    }
}
