import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/services/form_service.dart';
import '../../../core/localizations/formatic_localizations.dart';
import '../../forms/screens/form_editor_screen.dart';

/// Collaborate Screen — join form sebagai Collaborator via token_collab.
/// Sesuai Web FE: POST /form/share?form_slug=&body={token_collab}
/// Dipanggil dengan slug + token_collab (dari link yang di-paste user).
class CollaborateScreen extends StatefulWidget {
  final String formSlug;
  final String tokenCollab;

  const CollaborateScreen({
    super.key,
    required this.formSlug,
    required this.tokenCollab,
  });

  @override
  State<CollaborateScreen> createState() => _CollaborateScreenState();
}

class _CollaborateScreenState extends State<CollaborateScreen> {
  bool _isJoining = false;
  bool _joined = false;
  String _error = '';

  Future<void> _join() async {
    final l10n = FormaticLocalizations.of(context);
    setState(() {
      _isJoining = true;
      _error = '';
    });
    final result = await FormService.shareForm(
      formSlug: widget.formSlug,
      tokenCollab: widget.tokenCollab,
    );
    if (!mounted) return;
    setState(() => _isJoining = false);
    if (result['success'] == true) {
      setState(() => _joined = true);
    } else {
      setState(() => _error =
          result['message'] ?? l10n.collaborateJoinFailed);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = FormaticLocalizations.of(context);
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
        ),
        title: Text(
          l10n.collaborateTitle,
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: _joined ? _buildSuccess(l10n) : _buildJoin(l10n),
        ),
      ),
    );
  }

  Widget _buildJoin(FormaticLocalizations l10n) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.group_add_outlined,
              size: 36, color: AppColors.primary),
        ),
        const SizedBox(height: 24),
        Text(
          l10n.collaborateJoinAs,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.textPrimary,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 12),
        Text(
          l10n.collaborateFormLabel(widget.formSlug),
          style: const TextStyle(
              fontSize: 13,
              color: AppColors.textSecondary,
              fontFamily: 'monospace'),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 8),
        Text(
          l10n.collaborateBody,
          style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
          textAlign: TextAlign.center,
        ),
        if (_error.isNotEmpty) ...[
          const SizedBox(height: 16),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.error.withOpacity(0.3)),
            ),
            child: Row(
              children: [
                const Icon(Icons.error_outline,
                    size: 18, color: AppColors.error),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _error,
                    style: const TextStyle(
                        fontSize: 13, color: AppColors.error),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isJoining ? null : _join,
            icon: _isJoining
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: Colors.white))
                : const Icon(Icons.check, size: 18),
            label:
                Text(_isJoining ? l10n.collaborateJoining : l10n.collaborateJoin),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => Navigator.of(context).pop(),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.textPrimary,
              side: const BorderSide(color: AppColors.inputBorder),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(l10n.cancel),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccess(FormaticLocalizations l10n) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 72,
          height: 72,
          decoration: BoxDecoration(
            color: AppColors.success.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check_circle_outline,
              size: 40, color: AppColors.success),
        ),
        const SizedBox(height: 24),
        Text(
          l10n.collaborateSuccess,
          style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary),
        ),
        const SizedBox(height: 10),
        Text(
          l10n.collaborateSuccessBody,
          style: TextStyle(fontSize: 14, color: AppColors.textSecondary),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              Navigator.of(context).pushReplacement(MaterialPageRoute(
                builder: (_) => FormEditorScreen(
                  formId: '',
                  formTitle: widget.formSlug,
                  formSlug: widget.formSlug,
                ),
              ));
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              elevation: 0,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
            child: Text(l10n.collaborateOpenForm),
          ),
        ),
        const SizedBox(height: 12),
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: Text(
            l10n.collaborateBack,
            style: TextStyle(color: AppColors.textSecondary),
          ),
        ),
      ],
    );
  }
}
