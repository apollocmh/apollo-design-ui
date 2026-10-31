/** Border widths do not produce their own change event. All live hosts share one clock. */
const SAMPLE_INTERVAL = 500;

type Subscription = {
  read: () => void;
  getDocument: () => Document;
  document: Document;
};
type DocumentReaders = { readers: Set<Subscription>; onVisibilityChange: () => void };
const readers = new Set<Subscription>();
const documents = new Map<Document, DocumentReaders>();
let timer: ReturnType<typeof setInterval> | undefined;

function detach(subscription: Subscription): void {
  const group = documents.get(subscription.document);
  if (!group) return;
  group.readers.delete(subscription);
  if (group.readers.size === 0) {
    subscription.document.removeEventListener('visibilitychange', group.onVisibilityChange);
    documents.delete(subscription.document);
  }
}

function attach(subscription: Subscription): void {
  const doc = subscription.document;
  let group = documents.get(doc);
  if (!group) {
    const documentReaders = new Set<Subscription>();
    const onVisibilityChange = () => {
      if (!doc.hidden) {
        for (const reader of [...documentReaders]) sample(reader);
      }
    };
    group = { readers: documentReaders, onVisibilityChange };
    documents.set(doc, group);
    doc.addEventListener('visibilitychange', onVisibilityChange);
  }
  group.readers.add(subscription);
}

function sample(subscription: Subscription): void {
  // A DOM node can be adopted without a Vue render. Transfer its document listener on the tick.
  const doc = subscription.getDocument();
  if (doc !== subscription.document) {
    detach(subscription);
    subscription.document = doc;
    attach(subscription);
  }
  if (!doc.hidden) subscription.read();
}

export function subscribeBorderSample(read: () => void, getDocument: () => Document): () => void {
  const subscription = { read, getDocument, document: getDocument() };
  readers.add(subscription);
  attach(subscription);
  if (timer === undefined) {
    timer = setInterval(() => {
      for (const reader of [...readers]) sample(reader);
    }, SAMPLE_INTERVAL);
  }
  return () => {
    readers.delete(subscription);
    detach(subscription);
    if (readers.size === 0 && timer !== undefined) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/** Internal resource regression helper. */
export function borderSamplerSize(): number {
  return readers.size;
}
