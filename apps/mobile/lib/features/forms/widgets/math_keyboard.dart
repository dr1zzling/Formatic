import 'package:flutter/material.dart';
import 'package:flutter_quill/flutter_quill.dart';
import '../../../core/theme/app_colors.dart';

/// Professional Math Keyboard untuk Question Editor
/// Mendukung: Basic, Algebra, Fractions, Trigonometry, Geometry, Matrix, Calculus, Statistics, Set/Logic, Greek
/// Platform: Android only
/// Integration: Insert ke cursor position di Quill Delta
class MathKeyboard extends StatefulWidget {
  final QuillController controller;
  final VoidCallback? onSymbolInserted;

  const MathKeyboard({
    super.key,
    required this.controller,
    this.onSymbolInserted,
  });

  @override
  State<MathKeyboard> createState() => _MathKeyboardState();
}

class _MathKeyboardState extends State<MathKeyboard>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 10, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  /// Insert symbol di posisi cursor saat ini
  /// Format yang dihasilkan harus readable (bukan placeholder seperti "[2×2]")
  void _insertSymbol(String symbol) {
    final selection = widget.controller.selection;
    if (!selection.isValid) return;

    final index = selection.start;
    widget.controller.replaceText(index, 0, symbol, null);

    // Update cursor position setelah insert
    widget.controller.updateSelection(
      TextSelection.collapsed(offset: index + symbol.length),
      ChangeSource.remote,
    );

    widget.onSymbolInserted?.call();
  }

  /// Build tombol simbol yang responsif
  Widget _buildSymbolButton(String symbol, {String? label}) {
    return Tooltip(
      message: label ?? symbol,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: AppColors.inputBorder),
          borderRadius: BorderRadius.circular(8),
        ),
        child: InkWell(
          onTap: () => _insertSymbol(symbol),
          borderRadius: BorderRadius.circular(8),
          child: Center(
            child: Text(
              symbol,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ),
      ),
    );
  }

  /// Build grid simbol dengan responsive sizing
  Widget _buildSymbolGrid(List<String> symbols, {List<String>? labels}) {
    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 5,
        mainAxisSpacing: 8,
        crossAxisSpacing: 8,
        childAspectRatio: 1,
      ),
      itemCount: symbols.length,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemBuilder: (context, index) {
        return _buildSymbolButton(
          symbols[index],
          label: labels != null && index < labels.length
              ? labels[index]
              : symbols[index],
        );
      },
    );
  }

  /// Tab Basic: +, −, ×, ÷, =, ≠, ≈, ±, <, >, ≤, ≥, (, ), [, ], {, }, |, %, ∞
  Widget _buildTabBasic() {
    final basicSymbols = [
      '+',
      '−',
      '×',
      '÷',
      '=',
      '≠',
      '≈',
      '±',
      '<',
      '>',
      '≤',
      '≥',
      '(',
      ')',
      '[',
      ']',
      '{',
      '}',
      '|',
      '%',
      '∞',
    ];
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: _buildSymbolGrid(basicSymbols),
      ),
    );
  }

  /// Tab Algebra: x², xⁿ, x₁, xₙ, √x, ⁿ√x, a/b, log, ln, eˣ, |x|, π
  Widget _buildTabAlgebra() {
    final algebraSymbols = [
      'x²',
      'xⁿ',
      'x₁',
      'xₙ',
      '√',
      'ⁿ√',
      'a/b',
      'log',
      'ln',
      'eˣ',
      '|x|',
      'π',
    ];
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            _buildSymbolGrid(algebraSymbols),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Formula templates:',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            _buildFormulaButton('Quadratic', 'ax² + bx + c = 0'),
            _buildFormulaButton('Linear', 'ax + b = 0'),
            _buildFormulaButton('Exponential', 'aˣ = b'),
          ],
        ),
      ),
    );
  }

  /// Tab Fractions: UI untuk mengisi numerator/denominator
  Widget _buildTabFractions() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Simple Fraction (a/b)',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _buildFractionBuilder(),
            const SizedBox(height: 24),
            Text(
              'Mixed Fraction (n a/b)',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _buildMixedFractionBuilder(),
            const SizedBox(height: 24),
            Text(
              'Common Fractions:',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            _buildSymbolGrid(['½', '⅓', '⅔', '¼', '¾', '⅕']),
          ],
        ),
      ),
    );
  }

  /// Builder untuk simple fraction
  Widget _buildFractionBuilder() {
    final numController = TextEditingController();
    final denomController = TextEditingController();

    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: numController,
            decoration: InputDecoration(
              hintText: 'numerator',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 10,
                vertical: 8,
              ),
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(width: 8),
        Text(
          '/',
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: TextField(
            controller: denomController,
            decoration: InputDecoration(
              hintText: 'denominator',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 10,
                vertical: 8,
              ),
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: () {
            final num = numController.text.trim();
            final denom = denomController.text.trim();
            if (num.isNotEmpty && denom.isNotEmpty) {
              _insertSymbol('$num/$denom');
              numController.clear();
              denomController.clear();
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            padding: const EdgeInsets.symmetric(horizontal: 12),
          ),
          child: const Text(
            'Insert',
            style: TextStyle(fontSize: 12, color: Colors.white),
          ),
        ),
      ],
    );
  }

  /// Builder untuk mixed fraction
  Widget _buildMixedFractionBuilder() {
    final intController = TextEditingController();
    final numController = TextEditingController();
    final denomController = TextEditingController();

    return Row(
      children: [
        SizedBox(
          width: 50,
          child: TextField(
            controller: intController,
            decoration: InputDecoration(
              hintText: 'n',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 8,
              ),
            ),
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
          ),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: TextField(
            controller: numController,
            decoration: InputDecoration(
              hintText: 'num',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 8,
              ),
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(width: 4),
        Text(
          '/',
          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(width: 4),
        Expanded(
          child: TextField(
            controller: denomController,
            decoration: InputDecoration(
              hintText: 'denom',
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 8,
                vertical: 8,
              ),
            ),
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: () {
            final intVal = intController.text.trim();
            final num = numController.text.trim();
            final denom = denomController.text.trim();
            if (intVal.isNotEmpty && num.isNotEmpty && denom.isNotEmpty) {
              _insertSymbol('$intVal $num/$denom');
              intController.clear();
              numController.clear();
              denomController.clear();
            }
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            padding: const EdgeInsets.symmetric(horizontal: 8),
          ),
          child: const Text(
            'Insert',
            style: TextStyle(fontSize: 11, color: Colors.white),
          ),
        ),
      ],
    );
  }

  /// Tab Trigonometry
  Widget _buildTabTrigonometry() {
    final trigSymbols = [
      'sin',
      'cos',
      'tan',
      'cot',
      'sec',
      'csc',
      'sin⁻¹',
      'cos⁻¹',
      'tan⁻¹',
      'sin²',
      'cos²',
      'tan²',
      'θ',
      'α',
      'β',
      'φ',
      '°',
      'rad',
    ];
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            _buildSymbolGrid(trigSymbols),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Common Identities:',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            _buildFormulaButton(
              'Pythagorean',
              'sin²(θ) + cos²(θ) = 1',
            ),
            _buildFormulaButton(
              'Double Angle',
              'sin(2θ) = 2sin(θ)cos(θ)',
            ),
          ],
        ),
      ),
    );
  }

  /// Tab Geometry
  Widget _buildTabGeometry() {
    final geomSymbols = [
      'π',
      '∠',
      '△',
      '⊥',
      '∥',
      '°',
      '→',
      'r',
      'd',
      'A',
      'P',
      'V',
    ];
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            _buildSymbolGrid(geomSymbols),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Common Formulas:',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            _buildFormulaButton('Circle Area', 'A = πr²'),
            _buildFormulaButton('Circle Circumference', 'C = 2πr'),
            _buildFormulaButton('Triangle Area', 'A = ½ × base × height'),
          ],
        ),
      ),
    );
  }

  /// Tab Matrix — Matrix Builder UI dengan visual grid
  Widget _buildTabMatrix() {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Matrix Builder:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _buildMatrixBuilderButton('2×2'),
                _buildMatrixBuilderButton('2×3'),
                _buildMatrixBuilderButton('3×2'),
                _buildMatrixBuilderButton('3×3'),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'Matrix Operations:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _buildSymbolGrid(['Aᵀ', 'A⁻¹', 'det(A)', 'I', 'tr(A)'], labels: [
              'Transpose',
              'Inverse',
              'Determinant',
              'Identity',
              'Trace'
            ]),
          ],
        ),
      ),
    );
  }

  /// Builder untuk matrix dengan grid UI
  void _showMatrixBuilder(int rows, int cols) {
    final controllers = List.generate(
      rows * cols,
      (_) => TextEditingController(),
    );

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Build $rows×$cols Matrix'),
        content: SingleChildScrollView(
          child: SizedBox(
            width: double.maxFinite,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Matrix grid
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border.all(color: AppColors.inputBorder),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Column(
                    children: List.generate(rows, (r) {
                      return Padding(
                        padding: EdgeInsets.only(
                          bottom: r < rows - 1 ? 8 : 0,
                        ),
                        child: Row(
                          children: List.generate(cols, (c) {
                            final index = r * cols + c;
                            return Expanded(
                              child: Padding(
                                padding: EdgeInsets.only(
                                  right: c < cols - 1 ? 8 : 0,
                                ),
                                child: TextField(
                                  controller: controllers[index],
                                  textAlign: TextAlign.center,
                                  keyboardType: TextInputType.text,
                                  decoration: InputDecoration(
                                    hintText: '0',
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    contentPadding: const EdgeInsets.all(8),
                                    isDense: true,
                                  ),
                                  maxLines: 1,
                                ),
                              ),
                            );
                          }),
                        ),
                      );
                    }),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Example: 2, 3, 4 or a, b, c',
                  style: TextStyle(
                    fontSize: 11,
                    color: AppColors.textHint,
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              // Build matrix string
              final rows_ = <String>[];
              for (int r = 0; r < rows; r++) {
                final row = <String>[];
                for (int c = 0; c < cols; c++) {
                  final val = controllers[r * cols + c].text.trim();
                  row.add(val.isEmpty ? '0' : val);
                }
                rows_.add(row.join(' '));
              }
              final matrix = rows_.join(' | ');
              _insertSymbol(matrix);
              Navigator.pop(ctx);

              // Cleanup
              for (final c in controllers) {
                c.dispose();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
            ),
            child: const Text('Insert'),
          ),
        ],
      ),
    );
  }

  /// Helper untuk Matrix Builder Button dengan dialog
  Widget _buildMatrixBuilderButton(String label) {
    final parts = label.split('×');
    final rows = int.parse(parts[0]);
    final cols = int.parse(parts[1]);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: AppColors.inputBorder),
        borderRadius: BorderRadius.circular(8),
      ),
      child: InkWell(
        onTap: () => _showMatrixBuilder(rows, cols),
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Text(
            label,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ),
    );
  }

  /// Tab Calculus
  Widget _buildTabCalculus() {
    final calcSymbols = [
      '∫',
      '∬',
      '∭',
      '∂',
      'd/dx',
      'lim',
      'Σ',
      'Π',
      '∞',
      'dx',
      'dy',
      'dz',
    ];
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            _buildSymbolGrid(calcSymbols),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Common Formulas:',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            _buildFormulaButton('Derivative', 'd/dx [f(x)]'),
            _buildFormulaButton('Integral', '∫ f(x) dx'),
            _buildFormulaButton('Limit', 'lim(x→a) f(x)'),
          ],
        ),
      ),
    );
  }

  /// Tab Statistics & Probability
  Widget _buildTabStatistics() {
    final statSymbols = [
      'μ',
      'σ',
      'σ²',
      'x̄',
      'P(A)',
      'P(A|B)',
      'E(X)',
      'n',
      'C(n,r)',
      'P(n,r)',
      '∑',
      'x',
    ];
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            _buildSymbolGrid(statSymbols),
            const SizedBox(height: 16),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Common Formulas:',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
            const SizedBox(height: 8),
            _buildFormulaButton('Mean', 'μ = ∑x / n'),
            _buildFormulaButton('Variance', 'σ² = ∑(x-μ)² / n'),
            _buildFormulaButton('Combination', 'C(n,r) = n! / (r!(n-r)!)'),
          ],
        ),
      ),
    );
  }

  /// Tab Set & Logic
  Widget _buildTabSetLogic() {
    final setSymbols = [
      '∈',
      '∉',
      '⊂',
      '⊆',
      '∪',
      '∩',
      '∅',
      '∀',
      '∃',
      '⇒',
      '⇔',
      '¬',
    ];
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: _buildSymbolGrid(setSymbols, labels: [
          'element of',
          'not element of',
          'subset of',
          'subset or equal',
          'union',
          'intersection',
          'empty set',
          'for all',
          'exists',
          'implies',
          'if and only if',
          'not'
        ]),
      ),
    );
  }

  /// Tab Greek Letters
  Widget _buildTabGreek() {
    final greekSymbols = [
      'α',
      'β',
      'γ',
      'δ',
      'ε',
      'θ',
      'λ',
      'μ',
      'π',
      'σ',
      'φ',
      'ω',
    ];
    final greekUpperSymbols = [
      'Δ',
      'Σ',
      'Ω',
      'Φ',
      'Λ',
      'Γ',
    ];
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Lowercase:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _buildSymbolGrid(greekSymbols),
            const SizedBox(height: 24),
            Text(
              'Uppercase:',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            _buildSymbolGrid(greekUpperSymbols),
          ],
        ),
      ),
    );
  }

  /// Helper untuk formula button
  Widget _buildFormulaButton(String label, String formula) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.primary.withOpacity(0.06),
          border: Border.all(color: AppColors.primary.withOpacity(0.2)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: InkWell(
          onTap: () => _insertSymbol(formula),
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                Text(
                  formula,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w700,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: AppColors.inputBorder),
        ),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Tab bar
          TabBar(
            controller: _tabController,
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: AppColors.primary,
            labelColor: AppColors.primary,
            unselectedLabelColor: AppColors.textSecondary,
            tabs: const [
              Tab(text: 'Basic'),
              Tab(text: 'Algebra'),
              Tab(text: 'Fractions'),
              Tab(text: 'Trigonometry'),
              Tab(text: 'Geometry'),
              Tab(text: 'Matrix'),
              Tab(text: 'Calculus'),
              Tab(text: 'Statistics'),
              Tab(text: 'Set/Logic'),
              Tab(text: 'Greek'),
            ],
          ),
          // Content
          SizedBox(
            height: isMobile ? 300 : 400,
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildTabBasic(),
                _buildTabAlgebra(),
                _buildTabFractions(),
                _buildTabTrigonometry(),
                _buildTabGeometry(),
                _buildTabMatrix(),
                _buildTabCalculus(),
                _buildTabStatistics(),
                _buildTabSetLogic(),
                _buildTabGreek(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
