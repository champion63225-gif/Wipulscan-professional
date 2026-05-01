import 'dart:math';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:wipulscan_pro/models/wifi_sample.dart';

/// Custom painter that projects 3D WiFi samples as colored cloud blobs
/// onto the 2D camera overlay, accounting for device orientation and position.
class CloudPainter extends CustomPainter {
  final List<WifiSample> samples;
  final double heading; // radians
  final double pitch;   // radians
  final double camX;
  final double camZ;

  CloudPainter({
    required this.samples,
    required this.heading,
    required this.pitch,
    required this.camX,
    required this.camZ,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (samples.isEmpty) return;

    final W = size.width;
    final H = size.height;
    final focal = W * 0.75;
    
    // Camera vectors
    final fwdX = sin(heading);
    final fwdZ = cos(heading);
    final rightX = cos(heading);
    final rightZ = -sin(heading);
    final cosP = cos(pitch);
    final sinP = sin(pitch);

    final now = DateTime.now();

    // 1. Calculate projections
    List<_Proj> projList = [];
    for (var s in samples) {
      // Calculate age for drifting
      final ageSec = now.difference(s.timestamp).inMilliseconds / 1000.0;
      
      // Apply cloud drift
      final dx = (s.x + (s.driftX * ageSec)) - camX;
      final dz = (s.z + (s.driftZ * ageSec)) - camZ;
      final dy = (s.y + (s.driftY * ageSec)); // Assuming camY is 0

      // Rotate around Y axis (heading)
      final depth = dx * fwdX + dz * fwdZ;
      final lat = dx * rightX + dz * rightZ;
      final vert = dy;

      // Rotate around X axis (pitch)
      final dp = depth * cosP - vert * sinP;
      final vp = depth * sinP + vert * cosP;

      if (dp < 0.15) continue; // Behind camera

      final sx = W / 2 + lat / dp * focal;
      final sy = H / 2 - vp / dp * focal;
      
      // Cloud expansion over time
      final currentRadius = s.radius + ageSec * 0.05;
      final sz = currentRadius / dp * focal;

      // Cull off-screen
      if (sx < -sz * 2 || sx > W + sz * 2 || sy < -sz * 2 || sy > H + sz * 2) continue;

      projList.add(_Proj(sx, sy, sz, dp, s, ageSec));
    }

    // 2. Sort far-to-near
    projList.sort((a, b) => b.dp.compareTo(a.dp));

    // 3. Draw with Screen blend mode for volumetric clouds
    canvas.saveLayer(Offset.zero & size, Paint()..blendMode = BlendMode.screen);
    for (var p in projList) {
      // Age fade
      double ageFade = 1.0;
      if (p.ageSec > 300) {
        ageFade = 0.0;
      } else if (p.ageSec > 120) {
        ageFade = 1.0 - ((p.ageSec - 120) / 180);
      }
      
      final af = min(1.0, 1.8 / p.dp) * p.s.alpha * ageFade;
      if (af < 0.01) continue;

      final color = Color.fromARGB(255, p.s.r, p.s.g, p.s.b);
      final r = p.sz;

      final grad = ui.Gradient.radial(
        Offset(p.sx, p.sy),
        r,
        [
          color.withOpacity(af * 0.45),
          color.withOpacity(af * 0.25),
          color.withOpacity(af * 0.08),
          color.withOpacity(0.0),
        ],
        [0.0, 0.4, 0.7, 1.0],
      );

      canvas.drawCircle(Offset(p.sx, p.sy), r, Paint()..shader = grad);
    }
    canvas.restore();

    // 4. Central Reticle
    final cx = W / 2, cy = H / 2;
    final retPaint = Paint()
      ..color = const Color(0x26D4AF37) // gold 15%
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;
    canvas.drawCircle(Offset(cx, cy), 18, retPaint);
    canvas.drawLine(Offset(cx - 26, cy), Offset(cx - 10, cy), retPaint);
    canvas.drawLine(Offset(cx + 10, cy), Offset(cx + 26, cy), retPaint);
    canvas.drawLine(Offset(cx, cy - 26), Offset(cx, cy - 10), retPaint);
    canvas.drawLine(Offset(cx, cy + 10), Offset(cx, cy + 26), retPaint);
  }

  @override
  bool shouldRepaint(CloudPainter oldDelegate) => true;
}

class _Proj {
  final double sx, sy, sz, dp, ageSec;
  final WifiSample s;
  _Proj(this.sx, this.sy, this.sz, this.dp, this.s, this.ageSec);
}
