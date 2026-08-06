import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { API_BASE, API_ENDPOINTS, API_GROUPS, AUTH_NOTE } from '@/data/api.seed';
import { isLive } from '@/services/apiClient';

/** Copies text and confirms it — a copy button with no feedback is a mystery. */
function CopyButton({ value, label = 'Copy' }) {
  const { notify } = useToast();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      notify('Your browser blocked clipboard access.', 'danger');
    }
  };

  return (
    <Button variant="secondary" size="sm" icon={copied ? 'check' : 'copy'} onClick={copy}>
      {copied ? 'Copied' : label}
    </Button>
  );
}

function ParamTable({ title, rows }) {
  if (!rows?.length) return null;

  return (
    <div className="stack stack--tight">
      <span className="eyebrow">{title}</span>
      <div className="table-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th style={{ width: 180 }}>Name</th>
              <th style={{ width: 110 }}>Type</th>
              <th style={{ width: 80 }}>Required</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="mono small">{row.name}</td>
                <td className="mono micro faint">{row.type}</td>
                <td>
                  <Badge tone={row.required ? 'primary' : 'muted'}>{row.required ? 'Yes' : 'No'}</Badge>
                </td>
                <td className="small muted">{row.description ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ApiDocumentation() {
  const [activeId, setActiveId] = useState(API_ENDPOINTS[0].id);
  const endpoint = API_ENDPOINTS.find((e) => e.id === activeId) ?? API_ENDPOINTS[0];

  const sample = JSON.stringify(endpoint.response, null, 2);
  const curl = `curl -X ${endpoint.method} '${API_BASE}${endpoint.path}' \\\n  -H 'Authorization: Bearer <token>' \\\n  -H 'Content-Type: application/json'`;

  return (
    <>
      <PageHeader
        title="API documentation"
        subtitle="The same endpoints this console calls. Set VITE_API_BASE_URL and the app talks to them for real."
        actions={<Badge tone={isLive() ? 'success' : 'neutral'}>{isLive() ? 'Live API configured' : 'Running on demo data'}</Badge>}
      />

      <div className="grid" style={{ gridTemplateColumns: 'minmax(230px, 300px) minmax(0, 1fr)', alignItems: 'start' }}>
        <Card>
          <CardHead title="Endpoints" />
          <CardBody tight>
            {API_GROUPS.map((group) => {
              const groupEndpoints = API_ENDPOINTS.filter((e) => e.groupId === group.id);
              if (!groupEndpoints.length) return null;

              return (
                <div key={group.id} style={{ marginBottom: 'var(--s-3)' }}>
                  <div className="eyebrow" style={{ padding: '0 var(--s-2) var(--s-1)' }}>
                    {group.label}
                  </div>
                  <div className="endpoint-nav">
                    {groupEndpoints.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        className={`endpoint-nav__item ${e.id === activeId ? 'is-active' : ''}`.trim()}
                        onClick={() => setActiveId(e.id)}
                      >
                        <span className={`method method--${e.method.toLowerCase()}`}>{e.method}</span>
                        <span className="endpoint-nav__path">{e.path}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <div className="stack">
          <Card>
            <CardBody>
              <div className="stack">
                <div className="row row--tight">
                  <span className={`method method--${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                  <span className="mono strong">{endpoint.path}</span>
                </div>
                <h2>{endpoint.summary}</h2>
                {endpoint.description && <p className="small muted">{endpoint.description}</p>}

                <div className="row row--tight">
                  <code className="code__inline">{`${API_BASE}${endpoint.path}`}</code>
                  <CopyButton value={`${API_BASE}${endpoint.path}`} label="Copy URL" />
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="stack">
                <ParamTable title="Path parameters" rows={endpoint.params} />
                <ParamTable title="Query parameters" rows={endpoint.query} />
                <ParamTable title="Request body" rows={endpoint.body} />
                {!endpoint.params && !endpoint.query && !endpoint.body && (
                  <p className="small muted">This endpoint takes no parameters.</p>
                )}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Request" actions={<CopyButton value={curl} label="Copy cURL" />} />
            <CardBody>
              <pre className="code">{curl}</pre>
            </CardBody>
          </Card>

          <Card>
            <CardHead
              title="Response"
              subtitle="200 OK"
              actions={<CopyButton value={sample} label="Copy JSON" />}
            />
            <CardBody>
              <pre className="code">{sample}</pre>
            </CardBody>
          </Card>

          <Card>
            <CardHead title={AUTH_NOTE.title} />
            <CardBody>
              <div className="stack stack--tight">
                <p className="small muted">{AUTH_NOTE.body}</p>
                <pre className="code">{AUTH_NOTE.sample}</pre>
                <span className="row row--tight micro faint">
                  <Icon name="lock" size={12} />
                  Tokens are tenant-scoped — the same credentials cannot read another tenant’s book.
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

export default ApiDocumentation;
