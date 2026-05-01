import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:wipulscan_pro/theme.dart';

class IntroScreen extends StatefulWidget {
  final VoidCallback onComplete;
  const IntroScreen({super.key, required this.onComplete});

  @override
  State<IntroScreen> createState() => _IntroScreenState();
}

class _IntroScreenState extends State<IntroScreen> with TickerProviderStateMixin {
  late AnimationController _progressCtrl;
  late AnimationController _particleCtrl;
  late AnimationController _brandCtrl;
  late AnimationController _fadeOutCtrl;
  final _player = AudioPlayer();
  final _particles = <_Particle>[];
  bool _showFlash = false;
  bool _done = false;

  @override
  void initState() {
    super.initState();

    // Generate particles
    final rng = Random();
    for (int i = 0; i < 100; i++) {
      _particles.add(_Particle(
        x: rng.nextDouble(),
        y: rng.nextDouble(),
        vx: (rng.nextDouble() - 0.5) * 0.001,
        vy: (rng.nextDouble() - 0.5) * 0.001,
        radius: rng.nextDouble() * 1.6 + 0.3,
        opacity: rng.nextDouble() * 0.38 + 0.06,
        isGold: rng.nextDouble() > 0.55,
      ));
    }

    // Progress bar (4.5 seconds)
    _progressCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 4500))..forward();

    // Particle animation loop
    _particleCtrl = AnimationController(vsync: this, duration: const Duration(seconds: 60))
      ..repeat()
      ..addListener(() {
        if (mounted) setState(() { for (final p in _particles) p.update(); });
      });

    // Brand scale animation (elastic pop-in at 500ms)
    _brandCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 800));
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) _brandCtrl.forward();
    });

    // Fade-out controller (used before completing)
    _fadeOutCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));

    // Flash burst at 2s
    Future.delayed(const Duration(milliseconds: 2000), () {
      if (mounted) setState(() => _showFlash = true);
      Future.delayed(const Duration(milliseconds: 300), () {
        if (mounted) setState(() => _showFlash = false);
      });
    });

    // Play intro sound
    _player.setSource(AssetSource('sounds/jingle-intro-2.mp3')).then((_) {
      _player.setVolume(0.7);
      _player.resume();
    }).catchError((_) {});

    // Listen for sound completion – also trigger finish
    _player.onPlayerComplete.listen((_) => _finish());

    // Safety timeout: finish after progress bar ends + 900ms grace
    Future.delayed(const Duration(milliseconds: 5400), () => _finish());
  }

  void _finish() {
    if (_done || !mounted) return;
    _done = true;
    // Fade out, then complete
    _fadeOutCtrl.forward().then((_) {
      if (mounted) widget.onComplete();
    });
  }

  void _skip() {
    if (_done) return;
    _player.stop();
    _finish();
  }

  @override
  void dispose() {
    _progressCtrl.dispose();
    _particleCtrl.dispose();
    _brandCtrl.dispose();
    _fadeOutCtrl.dispose();
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sz = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: WColors.deep,
      body: GestureDetector(
        onTap: _skip,
        child: AnimatedBuilder(
          animation: _fadeOutCtrl,
          builder: (context, child) => Opacity(
            opacity: 1.0 - _fadeOutCtrl.value,
            child: child,
          ),
          child: Stack(
            children: [
              // Particles
              ...List.generate(_particles.length, (i) {
                final p = _particles[i];
                return Positioned(
                  left: p.x * sz.width,
                  top: p.y * sz.height,
                  child: Container(
                    width: p.radius * 2,
                    height: p.radius * 2,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: (p.isGold ? WColors.gold : WColors.goldLt).withOpacity(p.opacity),
                    ),
                  ),
                );
              }),

              // Brand text
              Center(
                child: ScaleTransition(
                  scale: CurvedAnimation(parent: _brandCtrl, curve: Curves.elasticOut),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ShaderMask(
                        shaderCallback: (rect) => const LinearGradient(
                          colors: [WColors.goldLt, WColors.gold, WColors.goldDk],
                        ).createShader(rect),
                        child: const Text('WIPULSCAN',
                          style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: 6, color: Colors.white)),
                      ),
                      const SizedBox(height: 6),
                      Text('PRO', style: TextStyle(
                        fontSize: 10, letterSpacing: 8, color: WColors.gold.withOpacity(0.4))),
                    ],
                  ),
                ),
              ),

              // Flash burst
              if (_showFlash)
                Positioned.fill(
                  child: Container(color: WColors.goldLt.withOpacity(0.3)),
                ),

              // Progress bar
              Positioned(
                bottom: 60,
                left: 40,
                right: 40,
                child: AnimatedBuilder(
                  animation: _progressCtrl,
                  builder: (context, child) => Container(
                    height: 2,
                    decoration: BoxDecoration(borderRadius: BorderRadius.circular(1)),
                    child: FractionallySizedBox(
                      alignment: Alignment.centerLeft,
                      widthFactor: _progressCtrl.value,
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(1),
                          gradient: const LinearGradient(colors: [WColors.goldDk, WColors.gold, WColors.goldLt]),
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // Skip hint
              Positioned(
                bottom: 30,
                left: 0,
                right: 0,
                child: Center(
                  child: Text('Tap to skip',
                    style: TextStyle(fontSize: 9, color: Colors.white.withOpacity(0.15), letterSpacing: 1)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Particle {
  double x, y, vx, vy, radius, opacity;
  bool isGold;
  _Particle({required this.x, required this.y, required this.vx, required this.vy,
    required this.radius, required this.opacity, required this.isGold});

  void update() {
    x += vx;
    y += vy;
    if (x < 0) x = 1;
    if (x > 1) x = 0;
    if (y < 0) y = 1;
    if (y > 1) y = 0;
  }
}
