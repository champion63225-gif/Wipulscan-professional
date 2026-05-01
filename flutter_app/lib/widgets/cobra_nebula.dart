import 'dart:math';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:wipulscan_pro/theme.dart';

// --- Simple 2D Noise for organic particle movement ---
class SimpleNoise {
  final _random = Random(42);
  final List<int> _p = List.generate(512, (index) => 0);

  SimpleNoise() {
    final p = List.generate(256, (i) => i);
    p.shuffle(_random);
    for (int i = 0; i < 512; i++) {
      _p[i] = p[i & 255];
    }
  }

  double noise2D(double x, double y) {
    int X = x.floor() & 255;
    int Y = y.floor() & 255;
    x -= x.floor();
    y -= y.floor();
    double u = fade(x);
    double v = fade(y);
    int A = _p[X] + Y, B = _p[X + 1] + Y;
    return lerp(
      v,
      lerp(u, grad(_p[A], x, y), grad(_p[B], x - 1, y)),
      lerp(u, grad(_p[A + 1], x, y - 1), grad(_p[B + 1], x - 1, y - 1)),
    );
  }

  double fade(double t) => t * t * t * (t * (t * 6 - 15) + 10);
  double lerp(double t, double a, double b) => a + t * (b - a);
  double grad(int hash, double x, double y) {
    int h = hash & 15;
    double u = h < 8 ? x : y;
    double v = h < 4 ? y : h == 12 || h == 14 ? x : 0.0;
    return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
  }
}

class _Particle {
  double bx, by; // Base position
  double x, y;   // Current position
  double r, a, sp, nox, noy, dr, ph;

  _Particle(double w, double h, Random rng)
      : bx = 0,
        by = 0,
        x = 0,
        y = 0,
        r = 20 + rng.nextDouble() * 80,
        a = 0.02 + rng.nextDouble() * 0.06,
        sp = 0.15 + rng.nextDouble() * 0.4,
        nox = rng.nextDouble() * 1000,
        noy = rng.nextDouble() * 1000,
        dr = 0.3 + rng.nextDouble() * 0.7,
        ph = rng.nextDouble() * pi * 2 {
    double angle = rng.nextDouble() * pi * 2;
    double d = rng.nextDouble() * min(w, h) * 0.38;
    bx = w / 2 + cos(angle) * d;
    by = h / 2 + sin(angle) * d;
    x = bx;
    y = by;
  }
}

class CobraNebula extends StatefulWidget {
  final int? rssiDbm;
  final bool isScanning;

  const CobraNebula({super.key, required this.rssiDbm, required this.isScanning});

  @override
  State<CobraNebula> createState() => _CobraNebulaState();
}

class _CobraNebulaState extends State<CobraNebula> with SingleTickerProviderStateMixin {
  late Ticker _ticker;
  final _noise = SimpleNoise();
  final _rng = Random(42);
  List<_Particle> _particles = [];
  double _time = 0;

  // Flowing state variables
  Color _curColor = const Color(0xFFEF4444);
  Color _tarColor = const Color(0xFFEF4444);
  double _curPct = 0;
  double _tarPct = 0;
  double _pulse = 1;
  double _pulseTar = 1;
  int _lastDbm = -90;

  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_tick)..start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  void _initParticles(Size size) {
    if (_initialized) return;
    _initialized = true;
    _particles = List.generate(60, (_) => _Particle(size.width, size.height, _rng));
  }

  void _updateTargets() {
    if (!widget.isScanning || widget.rssiDbm == null) {
      _tarPct = 0;
      _tarColor = const Color(0xFFEF4444); // CRITICAL RED
      return;
    }

    int dbm = widget.rssiDbm!.clamp(-90, -30);
    double pct = ((dbm + 90) / 60) * 100;
    _tarPct = pct;
    _tarColor = sigToCloudColor(pct.round());

    if ((dbm - _lastDbm).abs() > 3) {
      _pulseTar = 1.14;
      _lastDbm = dbm;
    }
  }

  void _tick(Duration elapsed) {
    _updateTargets();
    _time += 0.008;

    // Ghosting / easing
    _curColor = Color.lerp(_curColor, _tarColor, 0.05)!;
    _curPct += (_tarPct - _curPct) * 0.05;
    _pulse += (_pulseTar - _pulse) * 0.08;
    if ((_pulse - _pulseTar).abs() < 0.002) _pulseTar = 1;

    setState(() {}); // Trigger repaint
  }

  @override
  Widget build(BuildContext context) {
    final bool hasSignal = widget.isScanning && widget.rssiDbm != null;
    
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        if (!_initialized && size.width > 0) _initParticles(size);

        return CustomPaint(
          size: size,
          painter: _NebulaPainter(
            particles: _particles,
            noise: _noise,
            time: _time,
            curColor: _curColor,
            curPct: _curPct,
            pulse: _pulse,
            hasSignal: hasSignal,
          ),
        );
      },
    );
  }
}

class _NebulaPainter extends CustomPainter {
  final List<_Particle> particles;
  final SimpleNoise noise;
  final double time;
  final Color curColor;
  final double curPct;
  final double pulse;
  final bool hasSignal;

  _NebulaPainter({
    required this.particles,
    required this.noise,
    required this.time,
    required this.curColor,
    required this.curPct,
    required this.pulse,
    required this.hasSignal,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (particles.isEmpty) return;
    final w = size.width;
    final h = size.height;

    double en = curPct / 100.0;
    double ba = hasSignal ? (0.25 + en * 0.55) : 0.08;
    double sm = hasSignal ? (0.5 + en * 1.5) : 0.15;

    // Background Glow
    final bgRect = Rect.fromCircle(center: Offset(w / 2, h / 2), radius: w * 0.6);
    final bgPaint = Paint()
      ..shader = ui.Gradient.radial(
        Offset(w / 2, h / 2),
        w * 0.6,
        [
          curColor.withOpacity(hasSignal ? 0.08 : 0.02),
          curColor.withOpacity(hasSignal ? 0.03 : 0.01),
          Colors.transparent,
        ],
        [0.0, 0.5, 1.0],
      );
    canvas.drawRect(Offset.zero & size, bgPaint);

    canvas.saveLayer(Offset.zero & size, Paint()..blendMode = BlendMode.screen);

    // Particles
    for (final p in particles) {
      double nx = noise.noise2D(p.nox + time * p.dr, time * 0.5) * 2 - 1;
      double ny = noise.noise2D(p.noy + time * p.dr, time * 0.5 + 100) * 2 - 1;
      p.x = p.bx + nx * 60 * sm;
      p.y = p.by + ny * 60 * sm;
      
      p.bx += cos(time + p.ph) * p.sp * sm * 0.3;
      p.by += sin(time + p.ph) * p.sp * sm * 0.3;
      
      if (p.bx < -50) p.bx = w + 50;
      if (p.bx > w + 50) p.bx = -50;
      if (p.by < -50) p.by = h + 50;
      if (p.by > h + 50) p.by = -50;

      double dr = p.r * (0.8 + en * 0.6);
      
      final grad = ui.Gradient.radial(
        Offset(p.x, p.y),
        dr,
        [
          curColor.withOpacity(0.6 * p.a * ba),
          curColor.withOpacity(0.2 * p.a * ba),
          curColor.withOpacity(0),
        ],
        [0.0, 0.4, 1.0],
      );
      
      canvas.drawCircle(Offset(p.x, p.y), dr, Paint()..shader = grad);
    }
    
    // Pulse rings (only when active)
    if (hasSignal) {
      final rr = min(w, h) * 0.18;
      final ringPaint = Paint()
        ..color = curColor.withOpacity(0.12 + sin(time * 3) * 0.05)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5;
      canvas.drawCircle(Offset(w / 2, h / 2), rr * (1 + sin(time * 2) * 0.05) * pulse, ringPaint);

      final rr2 = min(w, h) * 0.28;
      final ringPaint2 = Paint()
        ..color = curColor.withOpacity(0.04 + sin(time * 1.3) * 0.02)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.8;
      canvas.drawCircle(Offset(w / 2, h / 2), rr2 * (1 + sin(time * 1.1) * 0.03) * pulse, ringPaint2);
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(_NebulaPainter oldDelegate) => true;
}
