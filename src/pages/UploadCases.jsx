import { useRef, useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { AsyncBoundary, SkeletonRows } from '@/components/ui/Feedback';
import { useAsync } from '@/hooks/useAsync';
import { useToast } from '@/context/ToastContext';
import { getUploadSchema, listUploads, uploadCases } from '@/services/admin.service';
import { formatDateTime, formatNumber } from '@/utils/format';

const STATUS_TONE = { completed: 'success', failed: 'danger', processing: 'warning' };

export function UploadCases() {
  const { notify } = useToast();
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: uploads, status, error, run } = useAsync(listUploads, []);
  const { data: schema } = useAsync(getUploadSchema, []);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.csv')) {
      notify('Only CSV files can be imported.', 'danger');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadCases(file);
      notify(
        result.rejected
          ? `${formatNumber(result.accepted)} rows imported, ${formatNumber(result.rejected)} rejected.`
          : `${formatNumber(result.accepted)} rows imported.`,
        result.rejected ? 'warning' : 'success',
      );
      await run();
    } catch (err) {
      notify(err.message ?? 'Upload failed.', 'danger');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Upload cases"
        subtitle="Import chargebacks from an acquirer file or claims from the marketplace export."
      />

      <div className="grid grid--split" style={{ alignItems: 'start' }}>
        <div className="stack">
          <Card>
            <CardBody>
              <div
                className={`dropzone ${dragging ? 'is-dragging' : ''}`.trim()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
              >
                <span className="empty__glyph">
                  <Icon name={uploading ? 'refresh' : 'upload'} size={22} />
                </span>
                <span className="strong">{uploading ? 'Importing…' : 'Drop a CSV here, or click to choose'}</span>
                <span className="small muted">
                  Rows that fail validation are rejected individually and reported — the rest of the batch still imports.
                </span>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Upload history" />
            <AsyncBoundary status={status} error={error} onRetry={run} skeleton={<SkeletonRows rows={5} />}>
              {uploads && (
                <div className="table-wrap">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>File</th>
                        <th>Uploaded by</th>
                        <th className="tbl__right">Rows</th>
                        <th className="tbl__right">Accepted</th>
                        <th className="tbl__right">Rejected</th>
                        <th style={{ width: 96 }}>Status</th>
                        <th className="tbl__right">When</th>
                      </tr>
                    </thead>
                    <tbody>
                      {uploads.map((upload) => (
                        <tr key={upload.id}>
                          <td>
                            <span className="stack" style={{ gap: 1 }}>
                              <span className="mono small">{upload.filename}</span>
                              {upload.note && <span className="micro faint">{upload.note}</span>}
                            </span>
                          </td>
                          <td className="small">{upload.uploadedBy}</td>
                          <td className="tbl__right mono small">{formatNumber(upload.rows)}</td>
                          <td className="tbl__right mono small">{formatNumber(upload.accepted)}</td>
                          <td
                            className="tbl__right mono small"
                            style={upload.rejected ? { color: 'var(--c-danger)' } : undefined}
                          >
                            {formatNumber(upload.rejected)}
                          </td>
                          <td>
                            <Badge tone={STATUS_TONE[upload.status] ?? 'neutral'}>{upload.status}</Badge>
                          </td>
                          <td className="tbl__right micro faint nowrap">{formatDateTime(upload.uploadedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </AsyncBoundary>
          </Card>
        </div>

        <Card>
          <CardHead title="Expected columns" subtitle="Header row must match these names exactly." />
          <div className="table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Example</th>
                  <th style={{ width: 70 }}>Required</th>
                </tr>
              </thead>
              <tbody>
                {(schema ?? []).map((column) => (
                  <tr key={column.column}>
                    <td>
                      <span className="stack" style={{ gap: 1 }}>
                        <span className="mono small">{column.column}</span>
                        {column.note && <span className="micro faint">{column.note}</span>}
                      </span>
                    </td>
                    <td className="mono micro faint">{column.example}</td>
                    <td>
                      <Badge tone={column.required ? 'primary' : 'muted'}>{column.required ? 'Yes' : 'No'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

export default UploadCases;
