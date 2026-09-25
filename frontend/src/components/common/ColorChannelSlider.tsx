interface ColorChannelSliderProps {
  label: string;
  color: string;
  brightness: number;
  disabled?: boolean;
  onColorChange: (color: string) => void;
  onBrightnessChange: (brightness: number) => void;
}

/** 颜色 + 亮度双通道滑块：场景编辑器逐灯调整使用。 */
export function ColorChannelSlider({
  label,
  color,
  brightness,
  disabled,
  onColorChange,
  onBrightnessChange
}: ColorChannelSliderProps) {
  return (
    <div className="color-slider">
      <div className="color-slider-head">
        <span>{label}</span>
        <input
          type="color"
          aria-label={`${label}颜色`}
          value={color}
          disabled={disabled}
          onChange={(event) => onColorChange(event.target.value)}
        />
      </div>
      <div className="color-slider-row">
        <input
          type="range"
          min={0}
          max={100}
          value={brightness}
          disabled={disabled}
          onChange={(event) => onBrightnessChange(Number(event.target.value))}
        />
        <span className="color-slider-value">{brightness}%</span>
      </div>
    </div>
  );
}
