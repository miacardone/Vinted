import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Card, { CardBody, CardHead } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Icon from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Badge';
import { Select, Textarea, TextInput } from '@/components/ui/Field';
import { useToast } from '@/context/ToastContext';
import { HELP_CONTACT_TOPICS, HELP_DOCS, HELP_FAQ, HELP_VIDEOS } from '@/data/help.seed';
import { useBrand } from '@/brand/BrandProvider';

function Accordion({ items }) {
  const [openId, setOpenId] = useState(items[0]?.id ?? null);

  return (
    <div className="accordion">
      {items.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="accordion__item">
            <button
              type="button"
              className="accordion__trigger"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              aria-expanded={isOpen}
            >
              <Icon name="help" size={15} className="faint" />
              {item.question}
              <Icon name="chevron" size={14} className={`accordion__chevron ${isOpen ? 'is-open' : ''}`.trim()} />
            </button>
            {isOpen && <div className="accordion__panel">{item.answer}</div>}
          </div>
        );
      })}
    </div>
  );
}

export function Help() {
  const brand = useBrand();
  const { notify } = useToast();

  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    // No ticketing backend in the demo — the form validates and confirms.
    setTimeout(() => {
      notify('Message sent. Support will reply by email.', 'success');
      setTopic('');
      setSubject('');
      setMessage('');
      setSending(false);
    }, 600);
  };

  return (
    <>
      <PageHeader
        title="Help"
        subtitle="Guides, reference material and a way to reach a person when the docs run out."
      />

      <div className="stack stack--loose">
        <Card>
          <CardHead title="Video walkthroughs" subtitle="Short, task-focused, in the order most people need them." />
          <CardBody>
            <div className="tile-grid">
              {HELP_VIDEOS.map((video) => (
                <button key={video.id} type="button" className="tile">
                  <span className="tile__thumb">
                    <Icon name="play" size={22} />
                  </span>
                  <span className="row row--between">
                    <span className="tile__title">{video.title}</span>
                    <span className="micro mono faint">{video.duration}</span>
                  </span>
                  <span className="tile__body">{video.description}</span>
                  <Badge tone="neutral">{video.level}</Badge>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHead title="Documentation and guides" />
          <CardBody>
            <div className="tile-grid">
              {HELP_DOCS.map((doc) => (
                <button key={doc.id} type="button" className="tile">
                  <span className="row row--between">
                    <Icon name="file" size={16} style={{ color: 'var(--c-primary)' }} />
                    <span className="micro faint">{doc.readingMinutes} min read</span>
                  </span>
                  <span className="tile__title">{doc.title}</span>
                  <span className="tile__body">{doc.description}</span>
                  <Badge tone="neutral">{doc.category}</Badge>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        <div className="grid grid--split" style={{ alignItems: 'start' }}>
          <Card>
            <CardHead title="Frequently asked" />
            <CardBody>
              <Accordion items={HELP_FAQ} />
            </CardBody>
          </Card>

          <Card>
            <CardHead title="Contact support" subtitle={`Replies go to your account email.`} />
            <CardBody>
              <form className="stack" onSubmit={send}>
                <Select
                  label="Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What is this about?"
                  options={HELP_CONTACT_TOPICS.map((t) => ({ value: t.id, label: t.label }))}
                />
                <TextInput
                  label="Subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="One line summary"
                />
                <Textarea
                  label="Message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  placeholder="Include case IDs where relevant — it saves a round trip."
                />
                <Button
                  type="submit"
                  variant="primary"
                  icon="send"
                  disabled={!topic || !subject.trim() || !message.trim() || sending}
                >
                  {sending ? 'Sending…' : 'Send message'}
                </Button>

                <p className="micro faint">
                  Urgent production issues: <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>
                </p>
              </form>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}

export default Help;
