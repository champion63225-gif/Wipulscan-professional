import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:sensors_plus/sensors_plus.dart';

/// Device motion tracking: gyroscope orientation + accelerometer step detection
class MotionService extends ChangeNotifier {
  static const stepLen = 0.65; // average step length meters
  static const stepThreshold = 3.0; // acceleration delta
  static const stepCooldown = 350; // ms

  // Orientation (degrees)
  double alpha = 0; // yaw / heading
  double beta = 90; // pitch
  double gamma = 0; // roll

  // Position in world space (meters)
  double posX = 0;
  double posZ = 0;

  // Step counter
  int steps = 0;

  // Internal
  double _lastMag = 9.8;
  int _lastStepMs = 0;
  StreamSubscription? _gyroSub;
  StreamSubscription? _accelSub;

  double get headingRad => alpha * pi / 180;
  double get distanceM => steps * stepLen;

  void start() {
    // Gyroscope → orientation tracking
    _gyroSub = gyroscopeEventStream().listen((event) {
      // Integrate angular velocity (simplified)
      alpha = (alpha + event.z * 180 / pi * 0.02) % 360;
      beta = (beta + event.x * 180 / pi * 0.02).clamp(0, 180);
      gamma = (gamma + event.y * 180 / pi * 0.02).clamp(-90, 90);
    });

    // Accelerometer → step detection
    _accelSub = accelerometerEventStream().listen((event) {
      final mag = sqrt(event.x * event.x + event.y * event.y + event.z * event.z);
      final diff = (mag - _lastMag).abs();
      _lastMag = 0.8 * _lastMag + 0.2 * mag;

      final now = DateTime.now().millisecondsSinceEpoch;
      if (diff > stepThreshold && now - _lastStepMs > stepCooldown) {
        _lastStepMs = now;
        final h = headingRad;
        posX += sin(h) * stepLen;
        posZ += cos(h) * stepLen;
        steps++;
        notifyListeners();
      }
    });
  }

  void stop() {
    _gyroSub?.cancel();
    _accelSub?.cancel();
    _gyroSub = null;
    _accelSub = null;
  }

  void reset() {
    posX = 0;
    posZ = 0;
    steps = 0;
    alpha = 0;
    beta = 90;
    gamma = 0;
    _lastMag = 9.8;
    notifyListeners();
  }

  @override
  void dispose() {
    stop();
    super.dispose();
  }
}
