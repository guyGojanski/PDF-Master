import { Button } from '@/components/ui/button';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';

interface SpinnerItemProps {
  title?: string;
  description?: string;
  progress?: number;
  onCancel?: () => void;
}

export function SpinnerItem({ onCancel }: SpinnerItemProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4 [--radius:1rem]">
      <Item variant="outline">
        <ItemMedia variant="icon">
          <Spinner />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{'Uploading...'}</ItemTitle>
          <ItemDescription>
            {'Please wait while your file is being uploaded.'}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="hidden sm:flex">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </ItemActions>
        <ItemFooter>
          <Progress value={0} />
        </ItemFooter>
      </Item>
    </div>
  );
}
