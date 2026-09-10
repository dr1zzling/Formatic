import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';

/// Reusable audio player widget — plays a remote URL (backend audio) or a
/// local device file (newly picked audio during question editing).
/// Keeps Formatic theme: rounded container, primary accent, play/pause + seek.
class FormAudioPlayer extends StatefulWidget {
  final String url;
  final String? deviceFilePath;

  const FormAudioPlayer({super.key, required this.url, this.deviceFilePath});

  @override
  State<FormAudioPlayer> createState() => _FormAudioPlayerState();
}

class _FormAudioPlayerState extends State<FormAudioPlayer> {
  late final AudioPlayer _player;
  Source? _source;
  bool _ready = false;
  bool _error = false;
  bool _playing = false;
  Duration _position = Duration.zero;
  Duration _duration = Duration.zero;

  @override
  void initState() {
    super.initState();
    _player = AudioPlayer();
    _source = (widget.deviceFilePath != null && widget.deviceFilePath!.isNotEmpty)
        ? DeviceFileSource(widget.deviceFilePath!)
        : UrlSource(widget.url);

    _player.onPlayerStateChanged.listen((state) {
      if (!mounted) return;
      setState(() => _playing = state == PlayerState.playing);
    });
    _player.onPositionChanged.listen((pos) {
      if (!mounted) return;
      setState(() => _position = pos);
    });
    _player.onDurationChanged.listen((dur) {
      if (!mounted) return;
      setState(() => _duration = dur);
    });
    _player.onPlayerComplete.listen((_) {
      if (!mounted) return;
      setState(() {
        _playing = false;
        _position = Duration.zero;
      });
    });

    _init();
  }

  Future<void> _init() async {
    try {
      await _player.setSource(_source!);
      if (mounted) setState(() => _ready = true);
    } catch (_) {
      if (mounted) setState(() => _error = true);
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  Future<void> _togglePlay() async {
    if (!_ready) return;
    if (_playing) {
      await _player.pause();
    } else {
      if (_duration > Duration.zero && _position >= _duration) {
        await _player.seek(Duration.zero);
      }
      await _player.resume();
    }
  }

  Future<void> _seek(double milliseconds) async {
    await _player.seek(Duration(milliseconds: milliseconds.round()));
  }

  String _format(Duration d) {
    final m = d.inMinutes;
    final s = d.inSeconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final double maxMs = _duration.inMilliseconds.toDouble();
    final sliderValue = maxMs <= 0
        ? 0.0
        : _position.inMilliseconds.clamp(0.0, maxMs).toDouble();

    return Container(
      padding: const EdgeInsets.fromLTRB(10, 6, 14, 6),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder),
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: (_ready && !_error) ? _togglePlay : null,
            icon: Icon(
              _playing ? Icons.pause_circle_filled : Icons.play_circle_filled,
              color: AppColors.primary,
              size: 34,
            ),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 38, minHeight: 38),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: _error
                ? const Text(
                    'Tidak dapat memuat audio',
                    style: TextStyle(
                        fontSize: 12, color: AppColors.error),
                  )
                : !_ready
                    ? const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: AppColors.primary,
                        ),
                      )
                    : Slider(
                        min: 0,
                        max: maxMs <= 0 ? 1 : maxMs,
                        value: sliderValue,
                        activeColor: AppColors.primary,
                        inactiveColor: AppColors.inputBorder,
                        onChanged: _seek,
                        onChangeEnd: _seek,
                      ),
          ),
          const SizedBox(width: 8),
          Text(
            '${_format(_position)} / ${_format(_duration)}',
            style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}