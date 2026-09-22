(function (AB) {
'use strict';

/* ---------------------------------------------------------------------------
   diagram.js — architecture diagrams from a declarative spec.

   For work that can't be screenshotted, the diagram IS the screenshot. Laying
   these out by hand means two diagrams that don't quite agree with each other;
   computing them from a spec means the column rhythm, box sizing and connector
   routing are identical across both systems.

   Colours come from CSS custom properties, so the diagrams re-theme with the
   page rather than carrying their own palette.
--------------------------------------------------------------------------- */

const NS = 'http://www.w3.org/2000/svg';

const el = (name, attrs = {}, text) => {
  const n = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
};

function renderDiagram(host, spec) {
  const W = 1000;
  const PAD_T = 34;
  const COL_GAP = 26;
  const ROW_H = 96;
  const BOX_W = (W - COL_GAP * (spec.cols.length - 1)) / spec.cols.length;
  const boxW = BOX_W - 10;

  const rows = Math.max(...spec.nodes.map((n) => n.row + (n.span || 1)));
  const H = PAD_T + rows * ROW_H + 6;

  const svg = el('svg', {
    viewBox: `0 0 ${W} ${H}`,
    role: 'img',
    'aria-labelledby': `${spec.id}-t ${spec.id}-d`,
  });
  svg.append(
    el('title', { id: `${spec.id}-t` }, spec.title),
    el('desc', { id: `${spec.id}-d` }, spec.desc)
  );

  const colX = (c) => c * (BOX_W + COL_GAP);
  const nodeBox = (n) => {
    const h = (n.span || 1) * ROW_H - 22;
    return {
      x: colX(n.col) + 5,
      y: PAD_T + n.row * ROW_H,
      w: boxW,
      h,
      cx: colX(n.col) + 5 + boxW / 2,
      cy: PAD_T + n.row * ROW_H + h / 2,
    };
  };

  /* ---- column headings ------------------------------------------------- */
  spec.cols.forEach((c, i) => {
    svg.append(
      el('text', {
        class: 'n-col',
        x: colX(i) + 5,
        y: 13,
        'font-size': '10.5',
      }, c.toUpperCase())
    );
    svg.append(
      el('line', {
        x1: colX(i) + 5,
        y1: 21,
        x2: colX(i) + 5 + boxW,
        y2: 21,
        stroke: 'var(--rule)',
        'stroke-width': '1',
      })
    );
  });

  /* ---- connectors, drawn under the boxes ------------------------------- */
  const byId = Object.fromEntries(spec.nodes.map((n) => [n.id, n]));
  const paths = [];

  spec.edges.forEach((e, i) => {
    const a = nodeBox(byId[e.from]);
    const b = nodeBox(byId[e.to]);
    const x1 = a.x + a.w;
    const x2 = b.x;
    const y1 = a.cy;
    const y2 = b.cy;
    const mid = x1 + (x2 - x1) * 0.5;
    const r = 7;

    let d;
    if (Math.abs(y1 - y2) < 2) {
      d = `M ${x1} ${y1} H ${x2 - 7}`;
    } else {
      const dir = y2 > y1 ? 1 : -1;
      d = [
        `M ${x1} ${y1}`,
        `H ${mid - r}`,
        `Q ${mid} ${y1} ${mid} ${y1 + r * dir}`,
        `V ${y2 - r * dir}`,
        `Q ${mid} ${y2} ${mid + r} ${y2}`,
        `H ${x2 - 7}`,
      ].join(' ');
    }

    const kind = e.kind === 'data' ? ' e-path--data' : '';
    const p = el('path', { class: `e-path${kind}`, d });
    p.style.setProperty('--i', i);
    svg.append(p);
    paths.push(p);

    /* arrowhead */
    const head = el('path', {
      class: `e-head${e.kind === 'data' ? ' e-head--data' : ''}`,
      d: `M ${x2} ${y2} l -7 -3.6 l 0 7.2 z`,
    });
    head.style.setProperty('--i', i);
    svg.append(head);
  });

  /* ---- nodes ----------------------------------------------------------- */
  for (const n of spec.nodes) {
    const b = nodeBox(n);
    const g = el('g');
    g.append(
      el('rect', {
        class: `n-box${n.kind === 'model' ? ' n-box--model' : ''}`,
        x: b.x, y: b.y, width: b.w, height: b.h, rx: 2,
      })
    );

    const hasSub = Boolean(n.sub);
    const labY = hasSub ? b.y + b.h / 2 - 2 : b.y + b.h / 2 + 5;
    g.append(el('text', {
      class: 'n-lab', x: b.x + 13, y: labY, 'font-size': '15',
    }, n.label));

    if (hasSub) {
      g.append(el('text', {
        class: 'n-sub', x: b.x + 13, y: b.y + b.h / 2 + 16, 'font-size': '11.5',
      }, n.sub));
    }
    svg.append(g);
  }

  host.replaceChildren(svg);

  /* dash lengths must be measured after the paths are in the document */
  requestAnimationFrame(() => {
    for (const p of paths) {
      const len = Math.ceil(p.getTotalLength()) || 400;
      p.style.setProperty('--len', len);
    }
  });

  return svg;
}

/* ------------------------------------------------------------- specs ---- */
/* Kept deliberately coarse. An accurate diagram with twenty boxes is harder to
   read than an honest one with eight — a reader should get the shape of the
   system in about four seconds, and the detail is in the prose underneath. */

const HUMANA = {
  id: 'arch-humana',
  title: 'Humana platform architecture',
  desc:
    'Claims, clinical events and scanned documents are ingested through Azure Data Factory, Event Hubs and OCR, then land in Databricks and Delta Lake alongside an Azure AI Search vector index. Risk and fraud models run on the lakehouse; a clinical assistant runs on the vector index. Scores are served through FastAPI and Azure Functions into the clinician workspace.',
  cols: ['Ingest', 'Store', 'Model', 'Serve'],
  nodes: [
    { id: 'in', col: 0, row: 0, span: 2, label: 'Claims, events & documents',
      sub: 'Data Factory · Event Hubs · OCR' },

    { id: 'lake', col: 1, row: 0, label: 'Databricks · Delta Lake', sub: '10M+ records a day' },
    { id: 'vec', col: 1, row: 1, label: 'Azure AI Search', sub: 'vector index' },

    { id: 'models', col: 2, row: 0, kind: 'model', label: 'Risk & fraud models',
      sub: 'Azure ML · XGBoost · LightGBM' },
    { id: 'rag', col: 2, row: 1, kind: 'model', label: 'Clinical assistant',
      sub: 'Azure OpenAI · LangChain' },

    { id: 'api', col: 3, row: 0, label: 'Scoring APIs', sub: 'FastAPI · Azure Functions' },
    { id: 'app', col: 3, row: 1, label: 'Clinician workspace', sub: 'grounded answers' },
  ],
  edges: [
    { from: 'in', to: 'lake', kind: 'data' },
    { from: 'in', to: 'vec', kind: 'data' },
    { from: 'lake', to: 'models' },
    { from: 'vec', to: 'rag' },
    { from: 'models', to: 'api' },
    { from: 'rag', to: 'app' },
  ],
};

const MASTERCARD = {
  id: 'arch-mastercard',
  title: 'Mastercard transaction architecture',
  desc:
    'Card transactions split into a real-time path on Amazon Kinesis and an event-driven batch path on SNS, SQS and Glue. Lambda scorers run fraud and anomaly detection on the stream while Step Functions reconcile CSV, JSON and Parquet datasets. Decisions are served by Spring Boot services on ECS backed by DynamoDB and Redis; reconciled sets land in S3 and RDS.',
  cols: ['Source', 'Stream', 'Process', 'Serve'],
  nodes: [
    { id: 'txn', col: 0, row: 0, span: 2, label: 'Card transactions',
      sub: 'authorisation flow' },

    { id: 'kin', col: 1, row: 0, label: 'Amazon Kinesis', sub: 'real-time path' },
    { id: 'queue', col: 1, row: 1, label: 'SNS · SQS · Glue', sub: 'event-driven batch' },

    { id: 'score', col: 2, row: 0, kind: 'model', label: 'Fraud scorers',
      sub: 'Lambda · anomaly + NLP' },
    { id: 'recon', col: 2, row: 1, label: 'Step Functions',
      sub: 'CSV · JSON · Parquet' },

    { id: 'svc', col: 3, row: 0, label: 'Spring Boot on ECS', sub: 'DynamoDB · Redis' },
    { id: 's3', col: 3, row: 1, label: 'Amazon S3 · RDS', sub: 'reconciled sets' },
  ],
  edges: [
    { from: 'txn', to: 'kin', kind: 'data' },
    { from: 'txn', to: 'queue', kind: 'data' },
    { from: 'kin', to: 'score', kind: 'data' },
    { from: 'queue', to: 'recon' },
    { from: 'score', to: 'svc', kind: 'data' },
    { from: 'recon', to: 's3' },
  ],
};

AB.renderDiagram = renderDiagram;
AB.HUMANA = HUMANA;
AB.MASTERCARD = MASTERCARD;
})(window.AB = (window.AB || {}));
