import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

class AppLogo extends StatelessWidget {
  const AppLogo({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(20),
          ),
          child: const Icon(
            Icons.description_outlined,
            size: 40,
            color: Colors.white,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'Formatic',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
        ),
      ],
    );
  }
}
