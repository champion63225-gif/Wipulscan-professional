import 'dart:ui';

/// A single WiFi measurement sample in 3D world space
class WifiSample {
  final double x;
  final double y;
  final double z;
  final double driftX;
  final double driftY;
  final double driftZ;
  final int r;
  final int g;
  final int b;
  final int sigPct;
  final Color color;
  final double radius;
  final double alpha;
  final DateTime timestamp;

  WifiSample({
    required this.x,
    required this.y,
    required this.z,
    required this.sigPct,
    required this.color,
    this.driftX = 0,
    this.driftY = 0,
    this.driftZ = 0,
    this.r = 255,
    this.g = 255,
    this.b = 255,
    this.radius = 0.4,
    this.alpha = 0.6,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  /// Age in seconds since creation
  double get ageSec => DateTime.now().difference(timestamp).inMilliseconds / 1000;

  /// Age-based opacity fade: full for 2min, fade over next 3min
  double get ageFade {
    final age = ageSec;
    if (age < 120) return 1.0;
    if (age > 300) return 0.0;
    return 1.0 - (age - 120) / 180;
  }
}
