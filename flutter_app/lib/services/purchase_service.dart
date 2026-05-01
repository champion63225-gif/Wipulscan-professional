import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PurchaseService extends ChangeNotifier {
  static const productId = 'wipulscan_pro_unlock';

  bool isPro = false;
  bool available = false;
  String? price;
  ProductDetails? _product;
  StreamSubscription<List<PurchaseDetails>>? _sub;

  Future<void> init() async {
    // Check local cache first
    final prefs = await SharedPreferences.getInstance();
    isPro = prefs.getBool('wps_pro') ?? false;
    if (isPro) {
      notifyListeners();
      return;
    }

    // Init store
    final iap = InAppPurchase.instance;
    available = await iap.isAvailable();
    if (!available) return;

    // Listen for purchases
    _sub = iap.purchaseStream.listen(_onPurchaseUpdate);

    // Load product
    final response = await iap.queryProductDetails({productId});
    if (response.productDetails.isNotEmpty) {
      _product = response.productDetails.first;
      price = _product!.price;
    }

    // Restore previous purchases
    await iap.restorePurchases();

    notifyListeners();
  }

  void _onPurchaseUpdate(List<PurchaseDetails> purchases) {
    for (final p in purchases) {
      if (p.productID == productId) {
        if (p.status == PurchaseStatus.purchased || p.status == PurchaseStatus.restored) {
          _unlock();
          if (p.pendingCompletePurchase) {
            InAppPurchase.instance.completePurchase(p);
          }
        }
      }
    }
  }

  Future<void> _unlock() async {
    isPro = true;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('wps_pro', true);
    notifyListeners();
  }

  Future<bool> purchase() async {
    if (_product == null || !available) return false;
    final param = PurchaseParam(productDetails: _product!);
    return InAppPurchase.instance.buyNonConsumable(purchaseParam: param);
  }

  Future<void> restore() async {
    if (!available) return;
    await InAppPurchase.instance.restorePurchases();
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }
}
