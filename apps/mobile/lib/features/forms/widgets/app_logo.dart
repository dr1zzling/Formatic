import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Icon(
            Icons.description_outlined,
            size: 32,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          'Formatic',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
                fontSize: 22,
              ),
        ),
      ],
    );
  }
}
