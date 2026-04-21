<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class PhotoboothController extends Controller
{
    public function index(Request $request)
    {
        $frames = [
            [
                'id' => 'classic',
                'name' => 'Classic',
                'path' => asset('frames/frame-classic.svg'),
            ],
            [
                'id' => 'neon',
                'name' => 'Neon',
                'path' => asset('frames/frame-neon.svg'),
            ],
            [
                'id' => 'minimal',
                'name' => 'Minimal',
                'path' => asset('frames/frame-minimal.svg'),
            ],
        ];

        return view('photobooth', [
            'frames' => $frames,
            'isPaid' => session('is_paid', false),
            'qrisImage' => asset('images/qris-raka.jpg'),
        ]);
    }

    public function confirmPayment(Request $request)
    {
        session(['is_paid' => true]);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran dikonfirmasi. Kamera siap diaktifkan.',
        ]);
    }
}