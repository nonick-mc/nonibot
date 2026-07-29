import { ComponentType } from 'discord-api-types/v10';
import { useWatch } from 'react-hook-form';
import { ComponentEditorContext } from '../context';
import { ContainerEditor } from './container';
import { MediaGalleryEditor } from './media-gallery';
import { SectionEditor } from './section';
import { SeparatorEditor } from './separator';
import { TextDisplayEditor } from './text-display';

type ComponentEditorByTypeProps = {
  name: string;
  index: number;
  onRemove: () => void;
};

export function ComponentEditorByType({ name, index, onRemove }: ComponentEditorByTypeProps) {
  const basePath = `${name}.${index}`;
  const type = useWatch({ name: `${basePath}.type` });

  const editor = (() => {
    switch (type) {
      case ComponentType.TextDisplay:
        return <TextDisplayEditor />;
      case ComponentType.Separator:
        return <SeparatorEditor />;
      case ComponentType.MediaGallery:
        return <MediaGalleryEditor />;
      case ComponentType.Section:
        return <SectionEditor />;
      case ComponentType.Container:
        return <ContainerEditor />;
      default:
        return null;
    }
  })();

  return (
    <ComponentEditorContext.Provider value={{ basePath, onRemove }}>
      {editor}
    </ComponentEditorContext.Provider>
  );
}
