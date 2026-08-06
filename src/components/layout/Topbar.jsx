import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/Icon';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useBrand } from '@/brand/BrandProvider';
import { ROUTES } from '@/utils/constants';

export function Topbar() {
  const { user, signOut } = useAuth();
  const brand = useBrand();
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    const query = term.trim();
    if (!query) return;

    // A case ID goes straight to the case; anything else searches the table.
    const looksLikeCaseId = new RegExp(`^${brand.numbering.prefix}[-–]?\\d+$`, 'i').test(query);
    if (looksLikeCaseId) {
      navigate(ROUTES.workCaseDetail(query.toUpperCase().replace(/[-–]/, brand.numbering.separator)));
    } else {
      navigate(`${ROUTES.caseManagement}?search=${encodeURIComponent(query)}`);
    }
    setTerm('');
  };

  return (
    <header className="topbar">
      <form className="topbar__search" onSubmit={onSearch} role="search">
        <Icon name="search" size={15} className="topbar__search-icon" />
        <input
          className="input"
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={`Search ${brand.terms.cases}, ARN, order or ${brand.terms.seller}…`}
          aria-label="Search cases"
        />
      </form>

      <div className="topbar__actions">
        <Button variant="ghost" size="sm" aria-label="Notifications">
          <Icon name="bell" size={17} />
        </Button>

        <div className="row row--tight" style={{ paddingLeft: 'var(--s-2)' }}>
          <span className="avatar">{user?.initials ?? '—'}</span>
          <span className="stack" style={{ gap: 0 }}>
            <span className="small strong nowrap">{user?.name}</span>
            <span className="micro faint nowrap">{user?.roleLabel}</span>
          </span>
        </div>

        <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out" title="Sign out">
          <Icon name="logout" size={16} />
        </Button>
      </div>
    </header>
  );
}

export default Topbar;
