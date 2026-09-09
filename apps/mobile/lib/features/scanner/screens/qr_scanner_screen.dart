import 'dart:async';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../../core/theme/app_colors.dart';
import '../../forms/screens/form_viewer_screen.dart';

class QrScannerScreen extends StatefulWidget {
  const QrScannerScreen({super.key});

  @override
  State<QrScannerScreen> createState() => _QrScannerScreenState();
}

class _QrScannerScreenState extends State<QrScannerScreen>
    with WidgetsBindingObserver {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  bool _hasScanned = false;
  bool _torchOn = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _controller.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (!_controller.value.isInitialized) return;
    if (state == AppLifecycleState.inactive) {
      _controller.stop();
    } else if (state == AppLifecycleState.resumed) {
      _controller.start();
    }
  }

  // ── Handle scanned QR ────────────────────────────────────────
  // QR dari Formatic berisi slug form (contoh: "survey-kepuasan-1234567890")
  // atau URL penuh (contoh: "http://host/fill/survey-kepuasan-1234567890")
  void _onDetect(BarcodeCapture capture) {
    if (_hasScanned) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode == null) return;
    final raw = barcode.rawValue;
    if (raw == null || raw.isEmpty) return;

    setState(() => _hasScanned = true);
    _controller.stop();

    // Extract slug: ambil bagian terakhir dari URL atau pakai raw langsung
    String slug = raw.trim();
    if (slug.contains('/')) {
      slug = slug.split('/').last;
    }

    if (!mounted) return;

    // Navigasi ke form viewer dengan slug
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => FormViewerScreen(slug: slug),
      ),
    );
  }

  void _toggleTorch() async {
    await _controller.toggleTorch();
    setState(() => _torchOn = !_torchOn);
  }

  void _showEnterCodeDialog() {
    final controller = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1A2B3C),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 32,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Masukkan Kode Form',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Masukkan slug form Formatic secara manual',
              style: TextStyle(
                fontSize: 13,
                color: Colors.white.withOpacity(0.6),
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: controller,
              autofocus: true,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                hintText: 'contoh: survey-kepuasan-1234567890',
                hintStyle:
                    TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13),
                filled: true,
                fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none,
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide(
                    color: AppColors.primary.withOpacity(0.7),
                    width: 1.5,
                  ),
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final slug = controller.text.trim();
                  if (slug.isEmpty) return;
                  Navigator.pop(ctx);
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(
                      builder: (_) => FormViewerScreen(slug: slug),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Buka Form',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D1821),
      body: Stack(
        children: [
          // ── Camera feed ────────────────────────────────────────
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),

          // ── Dark overlay with scan frame cutout ────────────────
          _buildScanOverlay(),

          // ── Top bar ────────────────────────────────────────────
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                children: [
                  // Close button
                  _buildCircleButton(
                    icon: Icons.close_rounded,
                    onTap: () => Navigator.of(context).pop(),
                  ),
                  const Spacer(),
                  // "SCAN QR CODE" label
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withOpacity(0.15),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 7,
                          height: 7,
                          decoration: const BoxDecoration(
                            color: Color(0xFF2EB56E),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 7),
                        const Text(
                          'SCAN QR CODE',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  // Torch button
                  _buildCircleButton(
                    icon: _torchOn
                        ? Icons.flash_on_rounded
                        : Icons.flash_off_rounded,
                    onTap: _toggleTorch,
                    iconColor: _torchOn ? Colors.amber : Colors.white,
                  ),
                ],
              ),
            ),
          ),

          // ── Center instruction text ────────────────────────────
          Positioned(
            left: 0,
            right: 0,
            top: MediaQuery.of(context).size.height * 0.18,
            child: Column(
              children: [
                const Text(
                  'Scan form QR to open',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Align the QR code inside the frame to\nautomatically view or participate',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.65),
                    fontSize: 13,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),

          // ── Bottom: Enter Code button ──────────────────────────
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
                child: Column(
                  children: [
                    // Enter code button
                    GestureDetector(
                      onTap: _showEnterCodeDialog,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF1E2D3D),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.1),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.keyboard_rounded,
                              color: Colors.white.withOpacity(0.8),
                              size: 20,
                            ),
                            const SizedBox(width: 10),
                            Text(
                              'Enter Code',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Hint text
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.lock_outline_rounded,
                          size: 13,
                          color: Colors.white.withOpacity(0.4),
                        ),
                        const SizedBox(width: 6),
                        Text(
                          'Point at any Formatic QR code to instantly start',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.4),
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Scan frame overlay ────────────────────────────────────────
  Widget _buildScanOverlay() {
    final size = MediaQuery.of(context).size;
    const frameSize = 260.0;
    final frameTop = size.height * 0.32;
    final frameLeft = (size.width - frameSize) / 2;

    return Stack(
      children: [
        // Dark overlay — 4 rectangles around the frame
        // Top
        Positioned(
          top: 0,
          left: 0,
          right: 0,
          height: frameTop,
          child: Container(color: Colors.black.withOpacity(0.65)),
        ),
        // Bottom
        Positioned(
          top: frameTop + frameSize,
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(color: Colors.black.withOpacity(0.65)),
        ),
        // Left
        Positioned(
          top: frameTop,
          left: 0,
          width: frameLeft,
          height: frameSize,
          child: Container(color: Colors.black.withOpacity(0.65)),
        ),
        // Right
        Positioned(
          top: frameTop,
          left: frameLeft + frameSize,
          right: 0,
          height: frameSize,
          child: Container(color: Colors.black.withOpacity(0.65)),
        ),

        // Corner brackets
        Positioned(
          top: frameTop,
          left: frameLeft,
          child: _buildScanFrame(frameSize),
        ),

        // Scan line animation
        Positioned(
          top: frameTop + 8,
          left: frameLeft + 8,
          child: _ScanLine(frameSize: frameSize - 16),
        ),
      ],
    );
  }

  Widget _buildScanFrame(double size) {
    const cornerSize = 28.0;
    const strokeWidth = 3.0;
    const color = Color(0xFF28ACCE);
    const radius = 6.0;

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        children: [
          // Top-left
          Positioned(
            top: 0, left: 0,
            child: _Corner(
              topLeft: true,
              size: cornerSize,
              stroke: strokeWidth,
              color: color,
              radius: radius,
            ),
          ),
          // Top-right
          Positioned(
            top: 0, right: 0,
            child: _Corner(
              topRight: true,
              size: cornerSize,
              stroke: strokeWidth,
              color: color,
              radius: radius,
            ),
          ),
          // Bottom-left
          Positioned(
            bottom: 0, left: 0,
            child: _Corner(
              bottomLeft: true,
              size: cornerSize,
              stroke: strokeWidth,
              color: color,
              radius: radius,
            ),
          ),
          // Bottom-right
          Positioned(
            bottom: 0, right: 0,
            child: _Corner(
              bottomRight: true,
              size: cornerSize,
              stroke: strokeWidth,
              color: color,
              radius: radius,
            ),
          ),
          // Center crosshair
          Center(
            child: Icon(
              Icons.add,
              size: 20,
              color: Colors.white.withOpacity(0.3),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCircleButton({
    required IconData icon,
    required VoidCallback onTap,
    Color iconColor = Colors.white,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withOpacity(0.2)),
        ),
        child: Icon(icon, color: iconColor, size: 20),
      ),
    );
  }
}

// ── Scan line animation ───────────────────────────────────────
class _ScanLine extends StatefulWidget {
  final double frameSize;
  const _ScanLine({required this.frameSize});

  @override
  State<_ScanLine> createState() => _ScanLineState();
}

class _ScanLineState extends State<_ScanLine>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _anim = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (_, __) {
        return SizedBox(
          width: widget.frameSize,
          height: widget.frameSize,
          child: Stack(
            children: [
              Positioned(
                top: _anim.value * (widget.frameSize - 3),
                left: 0,
                right: 0,
                child: Container(
                  height: 3,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        Colors.transparent,
                        const Color(0xFF2EB56E).withOpacity(0.3),
                        const Color(0xFF2EB56E),
                        const Color(0xFF2EB56E).withOpacity(0.3),
                        Colors.transparent,
                      ],
                    ),
                    borderRadius: BorderRadius.circular(2),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF2EB56E).withOpacity(0.6),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// ── Corner bracket widget ─────────────────────────────────────
class _Corner extends StatelessWidget {
  final bool topLeft, topRight, bottomLeft, bottomRight;
  final double size, stroke, radius;
  final Color color;

  const _Corner({
    this.topLeft = false,
    this.topRight = false,
    this.bottomLeft = false,
    this.bottomRight = false,
    required this.size,
    required this.stroke,
    required this.color,
    required this.radius,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: CustomPaint(
        painter: _CornerPainter(
          topLeft: topLeft,
          topRight: topRight,
          bottomLeft: bottomLeft,
          bottomRight: bottomRight,
          stroke: stroke,
          color: color,
          radius: radius,
        ),
      ),
    );
  }
}

class _CornerPainter extends CustomPainter {
  final bool topLeft, topRight, bottomLeft, bottomRight;
  final double stroke, radius;
  final Color color;

  _CornerPainter({
    required this.topLeft,
    required this.topRight,
    required this.bottomLeft,
    required this.bottomRight,
    required this.stroke,
    required this.color,
    required this.radius,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = stroke
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final s = size.width;
    final r = radius;

    if (topLeft) {
      path.moveTo(0, s);
      path.lineTo(0, r);
      path.arcToPoint(Offset(r, 0), radius: Radius.circular(r));
      path.lineTo(s, 0);
    }
    if (topRight) {
      path.moveTo(0, 0);
      path.lineTo(s - r, 0);
      path.arcToPoint(Offset(s, r), radius: Radius.circular(r));
      path.lineTo(s, s);
    }
    if (bottomLeft) {
      path.moveTo(s, s);
      path.lineTo(r, s);
      path.arcToPoint(Offset(0, s - r), radius: Radius.circular(r));
      path.lineTo(0, 0);
    }
    if (bottomRight) {
      path.moveTo(s, 0);
      path.lineTo(s, s - r);
      path.arcToPoint(Offset(s - r, s), radius: Radius.circular(r));
      path.lineTo(0, s);
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
