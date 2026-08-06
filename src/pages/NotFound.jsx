import { Link } from 'react-router-dom';
import { EmptyState } from '@/components/ui/Feedback';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { ROUTES } from '@/utils/constants';

export function NotFound() {
  return (
    <Card>
      <EmptyState
        icon="search"
        title="That page does not exist"
        body="The link may be out of date, or the page may have moved during the last release."
      >
        <Button as={Link} to={ROUTES.dashboard} variant="primary" icon="dashboard">
          Back to the dashboard
        </Button>
      </EmptyState>
    </Card>
  );
}

export default NotFound;
