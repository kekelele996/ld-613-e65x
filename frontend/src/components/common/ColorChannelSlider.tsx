interface ColorChannelSliderProps {
  label: string;
  value: number;
  min?: number;
  max: number;
  invalid?: boolean;
  onChange: (value: number) => void;
}

/** 单通道滑块：颜色通道 0-255，亮度 0-100 */
export function ColorChannelSlider({ label, value, min = 0, max, invalid, onChange }: ColorChannelSliderProps) {
  return (
    <label className={`channel-slider ${invalid ? "invalid" : ""}`}>
      <span className="channel-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        className="channel-number"
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
