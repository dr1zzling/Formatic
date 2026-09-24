import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/localizations/formatic_localizations.dart';

class MyFormCard extends StatelessWidget {
  final String title;
  final int questions;
  final int? responses;
  final String role;
  final String? visibility;
  final String? lastUpdated;
  final VoidCallback onTap;
  final VoidCallback? onDelete;

  const MyFormCard({
    super.key,
    required this.title,
    required this.questions,
    this.responses,
    required this.role,
    this.visibility,
    this.lastUpdated,
    required this.onTap,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = FormaticLocalizations.of(context);
    final roleLabel = role.toUpperCase() == 'CREATOR'
        ? l10n.formCreatorRole
        : role;
    final String visibilityLabel;
    if (visibility?.toLowerCase() == 'private') {
      visibilityLabel = l10n.formPrivate;
    } else if (visibility?.toLowerCase() == 'public') {
      visibilityLabel = l10n.formPublic;
    } else {
      visibilityLabel = visibility ?? '';
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.cardBorder),
          boxShadow: [
            BoxShadow(
              color: AppColors.cardShadow,
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: roleLabel == l10n.formCreatorRole
                        ? AppColors.primary.withOpacity(0.10)
                        : AppColors.textSecondary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    roleLabel,
                    style: TextStyle(
                      color: roleLabel == l10n.formCreatorRole
                          ? AppColors.primary
                          : AppColors.textSecondary,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                  ),
                ),
                const Spacer(),
                if (onDelete != null)
                  GestureDetector(
                    onTap: onDelete,
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        Icons.delete_outline,
                        color: AppColors.error.withOpacity(0.7),
                        size: 18,
                      ),
                    ),
                  ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.more_vert,
                  color: AppColors.textHint,
                  size: 20,
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              title,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
                fontFamily: 'Plus Jakarta Sans',
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Icon(
                  Icons.help_outline,
                  size: 14,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 4),
                Text(
                  l10n.questionsLabel(questions),
                  style: TextStyle(
                    fontSize: 12,
                    color: AppColors.textSecondary,
                    fontFamily: 'Plus Jakarta Sans',
                  ),
                ),
                const SizedBox(width: 14),
                if (responses != null) ...[
                  Icon(
                    Icons.people_outline,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    l10n.responsesLabel(responses ?? 0),
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                  ),
                ],
                if (visibility != null) ...[
                  const SizedBox(width: 14),
                  Icon(
                    visibility == 'private' ? Icons.lock_outline : Icons.visibility_outlined,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    visibilityLabel,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                  ),
                ],
                if (lastUpdated != null) ...[
                  const SizedBox(width: 14),
                  Icon(
                    Icons.access_time,
                    size: 14,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    lastUpdated!,
                    style: TextStyle(
                      fontSize: 12,
                      color: AppColors.textSecondary,
                      fontFamily: 'Plus Jakarta Sans',
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
