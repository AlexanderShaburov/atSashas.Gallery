import { TextBlock } from '@/models/Block';
type TextBlockProps = { block: TextBlock };
export default function TextComponent({ block }: TextBlockProps) {
  const { noteContent, align } = { ...block };

  return (
    <div className={`block note align${align}`}>
      <p>{noteContent}</p>
    </div>
  );
}
