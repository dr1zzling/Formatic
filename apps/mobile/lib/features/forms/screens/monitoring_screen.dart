import 'dart:async';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';

class MonitoringScreen extends StatefulWidget {
  final String formSlug;
  final String formTitle;

  const MonitoringScreen({
    super.key,
    required this.formSlug,
    required this.formTitle,
  });

  @override
  State<MonitoringScreen> createState() => _MonitoringScreenState();
}

class _MonitoringScreenState extends State<MonitoringScreen> {
  bool _isLoading = true;
  String _errorMessage = '';
  List<Map<String, dynamic>> _statusList = [];
  final Set<int> _resettingIds = {};

  @override
  void initState() {
    super.initState();
    _loadMonitoring();
  }

  Future<void> _loadMonitoring() async {
    setState(() { _isLoading = true; _errorMessage = ''; });
    final result = await FormService.getMonitoringStatus(widget.formSlug);
    if (!mounted) return;
    setState(() {
      _isLoading = false;
      if (result['success']) {
        _statusList = (result['status'] as List)
            .map((e) => Map<String, dynamic>.from(e as Map))
            .toList();
      } else {
        _errorMessage = result['message'] ?? 'Gagal memuat data monitoring.';
      }
    });
  }

  Future<void> _resetUser(int userId, String username) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Reset Peserta', style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text('Yakin ingin mereset pengerjaan "$username"?\n\nPeserta akan dapat mengerjakan form ini kembali dari awal.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(context).pop(false), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
    if (confirm != true || !mounted) return;
    setState(() => _resettingIds.add(userId));
    final result = await FormService.resetMonitoringUser(formSlug: widget.formSlug, userId: userId);
    if (!mounted) return;
    setState(() => _resettingIds.remove(userId));
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(result['message'] ?? (result['success'] ? 'Berhasil Reset' : 'Gagal melakukan reset')),
      backgroundColor: result['success'] ? AppColors.success : AppColors.error,
    ));
    if (result['success']) _loadMonitoring();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(onPressed: () => Navigator.of(context).pop(), icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary)),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Monitoring', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            Text(widget.formTitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.normal), overflow: TextOverflow.ellipsis),
          ],
        ),
        actions: [IconButton(onPressed: _loadMonitoring, icon: const Icon(Icons.refresh, color: AppColors.primary), tooltip: 'Refresh')],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _errorMessage.isNotEmpty ? _buildError() : _statusList.isEmpty ? _buildEmpty() : _buildContent(),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text(_errorMessage, textAlign: TextAlign.center, style: const TextStyle(fontSize: 15, color: AppColors.textSecondary)),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _loadMonitoring, icon: const Icon(Icons.refresh), label: const Text('Coba Lagi'),
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.people_outline, size: 80, color: AppColors.textSecondary.withOpacity(0.4)),
            const SizedBox(height: 16),
            const Text('Belum Ada Peserta', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.textSecondary)),
            const SizedBox(height: 8),
            const Text('Belum ada peserta yang mengerjakan form ini.', textAlign: TextAlign.center, style: TextStyle(fontSize: 14, color: AppColors.textHint)),
            const SizedBox(height: 24),
            OutlinedButton.icon(onPressed: _loadMonitoring, icon: const Icon(Icons.refresh), label: const Text('Refresh')),
          ],
        ),
      ),
    );
  }

  Widget _buildContent() {
    final total = _statusList.length;
    final progress = _statusList.where((e) => e['status'] == 'progress').length;
    final completed = _statusList.where((e) => e['status'] == 'completed').length;
    final reset = _statusList.where((e) => e['status'] == 'reset').length;

    return Column(
      children: [
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          child: Row(
            children: [
              _summaryChip('Total', total, AppColors.primary),
              const SizedBox(width: 10),
              _summaryChip('Progress', progress, AppColors.warning),
              const SizedBox(width: 10),
              _summaryChip('Selesai', completed, AppColors.success),
              const SizedBox(width: 10),
              _summaryChip('Reset', reset, AppColors.textSecondary),
            ],
          ),
        ),
        const Divider(height: 1),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadMonitoring,
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
              itemCount: _statusList.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) => _buildCard(_statusList[index]),
            ),
          ),
        ),
      ],
    );
  }

  Widget _summaryChip(String label, int count, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8),
        decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
        child: Column(
          children: [
            Text(count.toString(), style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            Text(label, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildCard(Map<String, dynamic> item) {
    final userId = item['user_id'];
    final userIdInt = userId is num ? userId.toInt() : int.tryParse(userId?.toString() ?? '');
    final username = item['user_username']?.toString() ?? 'Unknown';
    final status = item['status']?.toString() ?? '';
    // "attemps" sesuai nama field di backend (typo intentional, bukan "attempts")
    final attemps = item['attemps'];
    final attempsInt = attemps is num ? attemps.toInt() : int.tryParse(attemps?.toString() ?? '0') ?? 0;
    final startAt = _fmt(item['start_at']);
    final submittedAt = _fmt(item['submitted_at']);
    final isProgress = status == 'progress';
    final isCompleted = status == 'completed';
    final isReset = status == 'reset';
    final isResetting = userIdInt != null && _resettingIds.contains(userIdInt);

    Color sc; IconData si; String sl;
    if (isCompleted) { sc = AppColors.success; si = Icons.check_circle_outline; sl = 'Selesai'; }
    else if (isProgress) { sc = AppColors.warning; si = Icons.hourglass_top; sl = 'Sedang Mengerjakan'; }
    else if (isReset) { sc = AppColors.textSecondary; si = Icons.refresh; sl = 'Direset'; }
    else { sc = AppColors.textHint; si = Icons.help_outline; sl = status; }

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38, height: 38,
                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), shape: BoxShape.circle),
                child: Center(child: Text(username.isNotEmpty ? username[0].toUpperCase() : '?', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 16))),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(username, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppColors.textPrimary), overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 3),
                    Row(
                      children: [
                        Icon(si, size: 13, color: sc),
                        const SizedBox(width: 4),
                        Flexible(
                          child: Text(sl, style: TextStyle(fontSize: 12, color: sc, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                        ),
                        if (attempsInt > 1) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(color: AppColors.textHint.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                            child: Text('ke-$attempsInt', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              // Reset button — HANYA untuk status "progress"
              if (isProgress && userIdInt != null)
                isResetting
                    ? const SizedBox(width: 28, height: 28, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.error))
                    : IconButton(
                        onPressed: () => _resetUser(userIdInt, username),
                        icon: const Icon(Icons.restart_alt, color: AppColors.error, size: 22),
                        tooltip: 'Reset peserta ini',
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
                      ),
            ],
          ),
          if (_pageLabel(item).isNotEmpty) ...[
            const SizedBox(height: 8),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.article_outlined,
                    size: 13, color: AppColors.primary),
                const SizedBox(width: 4),
                Text(_pageLabel(item),
                    style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.primary,
                        fontWeight: FontWeight.w600)),
              ],
            ),
          ],
          if (startAt.isNotEmpty || submittedAt.isNotEmpty) ...[
            const SizedBox(height: 10),
            const Divider(height: 1),
            const SizedBox(height: 8),
            Wrap(
              spacing: 12,
              runSpacing: 4,
              children: [
                if (startAt.isNotEmpty)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.play_circle_outline, size: 13, color: AppColors.textHint),
                      const SizedBox(width: 4),
                      Text('Mulai: $startAt', style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
                    ],
                  ),
                if (submittedAt.isNotEmpty)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check_circle_outline, size: 13, color: AppColors.textHint),
                      const SizedBox(width: 4),
                      Text('Selesai: $submittedAt', style: const TextStyle(fontSize: 11, color: AppColors.textHint)),
                    ],
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  /// Label posisi halaman pengerjaan dari response monitoring backend
  /// (`current_page`, `total_pages`). Paritas kolom progres Web Monitoring.
  /// Kosong jika data tidak tersedia atau peserta sudah selesai.
  String _pageLabel(Map<String, dynamic> item) {
    final status = item['status']?.toString() ?? '';
    if (status == 'completed' || status == 'submitted') return '';
    final current = item['current_page'];
    final total = item['total_pages'];
    if (current == null) return '';
    final currentInt = current is num
        ? current.toInt()
        : int.tryParse(current.toString());
    if (currentInt == null) return '';
    final totalInt = total is num
        ? total.toInt()
        : int.tryParse(total?.toString() ?? '');
    if (totalInt != null && totalInt > 0) {
      return 'Halaman $currentInt/$totalInt';
    }
    return 'Halaman $currentInt';
  }

  String _fmt(dynamic raw) {
    if (raw == null) return '';
    DateTime? dt;
    if (raw is String && raw.isNotEmpty) {
      dt = DateTime.tryParse(raw);
      if (dt == null) {
        final ms = int.tryParse(raw);
        if (ms != null && ms > 0) dt = DateTime.fromMillisecondsSinceEpoch(ms);
      }
    } else if (raw is num && raw > 0) {
      dt = raw > 1e10
          ? DateTime.fromMillisecondsSinceEpoch(raw.toInt())
          : DateTime.fromMillisecondsSinceEpoch(raw.toInt() * 1000);
    }
    if (dt == null) return '';
    final local = dt.toLocal();
    final h = local.hour.toString().padLeft(2, '0');
    final m = local.minute.toString().padLeft(2, '0');
    final d = local.day.toString().padLeft(2, '0');
    final mo = local.month.toString().padLeft(2, '0');
    return '$d/$mo/${local.year} $h:$m';
  }
}
