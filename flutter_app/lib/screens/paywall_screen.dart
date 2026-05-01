import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:wipulscan_pro/services/purchase_service.dart';
import 'package:wipulscan_pro/theme.dart';

class PaywallScreen extends StatefulWidget {
  final VoidCallback onUnlock;
  final VoidCallback onClose;
  const PaywallScreen({super.key, required this.onUnlock, required this.onClose});

  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  bool _loading = false;
  String? _error;

  void _buy() async {
    setState(() { _loading = true; _error = null; });
    final iap = context.read<PurchaseService>();
    final ok = await iap.purchase();
    if (mounted) {
      setState(() => _loading = false);
      if (iap.isPro) {
        widget.onUnlock();
      } else if (!ok) {
        setState(() => _error = 'Purchase failed');
      }
    }
  }

  void _restore() async {
    setState(() { _loading = true; _error = null; });
    final iap = context.read<PurchaseService>();
    await iap.restore();
    if (mounted) {
      setState(() => _loading = false);
      if (iap.isPro) {
        widget.onUnlock();
      } else {
        setState(() => _error = 'No previous purchase found');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final iap = context.watch<PurchaseService>();
    final price = iap.price ?? '€1.99';

    return Scaffold(
      backgroundColor: WColors.deep.withOpacity(0.97),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const SizedBox(height: 16),
              Align(
                alignment: Alignment.topRight,
                child: GestureDetector(
                  onTap: widget.onClose,
                  child: Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: WColors.gold.withOpacity(0.2)),
                    ),
                    child: Icon(Icons.close, size: 16, color: WColors.gold.withOpacity(0.5)),
                  ),
                ),
              ),
              const Spacer(),
              // WiFi icon
              Icon(Icons.wifi, size: 48, color: WColors.gold.withOpacity(0.6)),
              const SizedBox(height: 16),
              ShaderMask(
                shaderCallback: (rect) => const LinearGradient(
                  colors: [WColors.goldLt, WColors.gold],
                ).createShader(rect),
                child: const Text('WIPULSCAN PRO',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700, letterSpacing: 2.5, color: Colors.white)),
              ),
              const SizedBox(height: 4),
              Text('Full AR Heatmap Scanner',
                style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.35), letterSpacing: 0.8)),
              const SizedBox(height: 24),
              // Features
              Container(
                padding: const EdgeInsets.symmetric(vertical: 16),
                decoration: BoxDecoration(
                  border: Border.symmetric(
                    horizontal: BorderSide(color: WColors.gold.withOpacity(0.08)),
                  ),
                ),
                child: Column(
                  children: [
                    _feat('Unlimited AR Scans'),
                    _feat('Real-time Signal Measurement'),
                    _feat('3D Cloud Visualization'),
                    _feat('Camera + Gyroscope Tracking'),
                    _feat('12 Languages'),
                    _feat('No Subscription · One-time'),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Buy button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _loading ? null : _buy,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: WColors.gold,
                    disabledBackgroundColor: WColors.gold.withOpacity(0.3),
                    foregroundColor: Colors.black,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
                    elevation: 8,
                    shadowColor: WColors.gold.withOpacity(0.3),
                    textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, letterSpacing: 1.5),
                  ),
                  child: Text(_loading ? '...' : 'Unlock Pro · $price'),
                ),
              ),
              const SizedBox(height: 12),
              // Restore
              GestureDetector(
                onTap: _loading ? null : _restore,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 8),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: WColors.gold.withOpacity(0.15)),
                  ),
                  child: Text('Restore Purchase',
                    style: TextStyle(fontFamily: 'SpaceMono', fontSize: 10, letterSpacing: 1.5,
                      color: WColors.gold.withOpacity(0.4))),
                ),
              ),
              if (_error != null) ...[
                const SizedBox(height: 8),
                Text(_error!, style: const TextStyle(fontFamily: 'SpaceMono', fontSize: 9, color: WColors.red)),
              ],
              const SizedBox(height: 16),
              Text('One-time purchase · No subscription · No recurring charges',
                style: TextStyle(fontFamily: 'SpaceMono', fontSize: 8, color: Colors.white.withOpacity(0.15)),
                textAlign: TextAlign.center),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _feat(String text) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          const Text('✓', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: WColors.green)),
          const SizedBox(width: 10),
          Text(text, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.55))),
        ],
      ),
    );
  }
}
