(function (AB) {
'use strict';

/* ---------------------------------------------------------------------------
   stack.js — the toolset, placed where it actually sits in a model's life.

   A résumé lists 108 tools in twelve alphabetised buckets. That tells a reader
   nothing about whether the person can own a system end to end. Placing the
   same 108 tools at the stage of the lifecycle where they're used does, and it
   lets a hiring manager jump straight to the stage they're hiring for.

   Every item here appears on the resume. Nothing is padded.

   Each entry is [label, ecosystem, cited?]. `eco` lets a reader filter:
   az = Azure, aws = AWS, oss = open source / vendor-neutral. `cited` marks
   the tools named in the two systems described above -- the ones this page
   itself puts evidence behind. Drawing that line is the point: a flat list of
   a hundred tools reads as keyword stuffing, and a hiring manager reads it as
   'has touched, cannot defend'.
   `eco` tags let a reader filter by ecosystem: az = Azure, aws = AWS,
   oss = open source / vendor-neutral.
--------------------------------------------------------------------------- */

const STAGES = [
  {
    id: 'ingest',
    n: '01',
    name: 'Ingest & stream',
    note: 'Claims, transactions and clinical events arriving continuously, not on a nightly cron.',
    items: [
      ['Kafka', 'oss'], ['Azure Event Hubs', 'az', 1], ['Amazon Kinesis', 'aws', 1],
      ['Azure Data Factory', 'az', 1], ['Azure Cognitive Services', 'az', 1],
      ['AWS Glue', 'aws', 1], ['Airflow', 'oss'],
      ['Step Functions', 'aws', 1], ['SNS', 'aws', 1], ['SQS', 'aws', 1],
      ['ETL', 'oss'], ['Batch processing', 'oss'], ['Streaming', 'oss'],
    ],
  },
  {
    id: 'store',
    n: '02',
    name: 'Store & lay out',
    note: 'Lakehouse for history, warehouse for analytics, OLTP for serving, vector store for retrieval.',
    items: [
      ['Delta Lake', 'oss'], ['Snowflake', 'oss'], ['Azure Synapse', 'az'],
      ['Amazon S3', 'aws', 1], ['PostgreSQL', 'oss'], ['MySQL', 'oss'],
      ['SQL Server', 'oss'], ['Amazon RDS', 'aws', 1], ['DynamoDB', 'aws', 1],
      ['Cosmos DB', 'az'], ['ElastiCache Redis', 'aws', 1], ['pgvector', 'oss'],
    ],
  },
  {
    id: 'transform',
    n: '03',
    name: 'Transform & feature',
    note: 'Where 10M+ records a day become columns a model can actually learn from.',
    items: [
      ['Apache Spark', 'oss'], ['PySpark', 'oss', 1], ['Databricks', 'oss', 1],
      ['Python', 'oss', 1], ['SQL', 'oss', 1], ['Java', 'oss', 1], ['Bash', 'oss'],
    ],
  },
  {
    id: 'train',
    n: '04',
    name: 'Train & tune',
    note: 'Gradient-boosted trees for tabular risk, deep nets for text and signals, classical models for time series.',
    items: [
      ['Scikit-learn', 'oss'], ['XGBoost', 'oss', 1], ['LightGBM', 'oss', 1],
      ['PyTorch', 'oss'], ['TensorFlow', 'oss'], ['spaCy', 'oss'],
      ['Autoencoders', 'oss'], ['Prophet', 'oss', 1], ['ARIMA', 'oss', 1],
      ['Azure Machine Learning', 'az', 1], ['LoRA / QLoRA', 'oss'],
      ['Quantization', 'oss'], ['Anomaly detection', 'oss', 1],
      ['Classification', 'oss', 1], ['Forecasting', 'oss', 1],
    ],
  },
  {
    id: 'retrieve',
    n: '05',
    name: 'Retrieve & generate',
    note: 'Grounding a language model in clinical SOPs and enterprise policy, so answers cite something real.',
    items: [
      ['Azure OpenAI', 'az', 1], ['OpenAI API', 'oss', 1], ['LangChain', 'oss', 1],
      ['LlamaIndex', 'oss'], ['Hugging Face Transformers', 'oss'],
      ['Azure AI Search', 'az', 1], ['RAG', 'oss', 1], ['Vector embeddings', 'oss', 1],
      ['Semantic search', 'oss', 1], ['FAISS', 'oss'], ['Pinecone', 'oss'],
      ['Agents', 'oss'], ['Tool calling', 'oss'], ['Structured outputs', 'oss'],
      ['Prompt engineering', 'oss'], ['vLLM', 'oss'],
    ],
  },
  {
    id: 'explain',
    n: '06',
    name: 'Evaluate & explain',
    note: 'In a regulated setting a score nobody can account for is a score nobody may act on.',
    items: [
      ['SHAP', 'oss', 1], ['LLM evaluation', 'oss'], ['Power BI', 'oss', 1],
      ['Plotly', 'oss'], ['Seaborn', 'oss'], ['Matplotlib', 'oss'],
      ['PyTest', 'oss', 1], ['JUnit', 'oss', 1], ['SonarQube', 'oss', 1],
    ],
  },
  {
    id: 'serve',
    n: '07',
    name: 'Serve',
    note: 'Scoring inside the clinical app and the transaction flow, at the latency those flows allow.',
    items: [
      ['FastAPI', 'oss', 1], ['Flask', 'oss'], ['Spring Boot', 'oss', 1],
      ['REST APIs', 'oss', 1], ['Azure Functions', 'az', 1], ['AWS Lambda', 'aws', 1],
      ['Amazon ECS', 'aws', 1], ['AWS Fargate', 'aws', 1], ['API Gateway', 'aws', 1],
      ['Amazon EC2', 'aws'], ['Docker', 'oss'],
    ],
  },
  {
    id: 'govern',
    n: '08',
    name: 'Observe & govern',
    note: 'Versioning, rollback, audit trail. The part that decides whether a model is allowed to stay in production.',
    items: [
      ['MLflow', 'oss', 1], ['Experiment tracking', 'oss', 1], ['Model versioning', 'oss', 1],
      ['Model monitoring', 'oss'], ['LLM tracing', 'oss'], ['Observability', 'oss'],
      ['CloudWatch', 'aws', 1], ['Terraform', 'oss', 1], ['Azure DevOps', 'az', 1],
      ['GitHub Actions', 'oss'], ['Jenkins', 'oss'], ['CI/CD', 'oss', 1],
      ['Azure Key Vault', 'az'], ['AWS IAM', 'aws', 1], ['VPC', 'aws', 1], ['KMS', 'aws', 1],
      ['PCI-DSS', 'oss', 1], ['HIPAA-aligned controls', 'oss', 1],
      ['Audit logging', 'oss', 1], ['Model governance', 'oss'], ['Git', 'oss'],
    ],
  },
];

const ECOSYSTEMS = [
  { id: 'all', label: 'Everything' },
  { id: 'az', label: 'Azure' },
  { id: 'aws', label: 'AWS' },
  { id: 'oss', label: 'Open source' },
];

const TOTAL = STAGES.reduce((n, s) => n + s.items.length, 0);

const CITED = STAGES.reduce(
  (n, s) => n + s.items.filter(([, , c]) => c).length, 0);

const countIn = (eco) =>
  eco === 'all'
    ? TOTAL
    : STAGES.reduce((n, s) => n + s.items.filter(([, e]) => e === eco).length, 0);

AB.STAGES = STAGES;
AB.ECOSYSTEMS = ECOSYSTEMS;
AB.TOTAL = TOTAL;
AB.CITED = CITED;
AB.countIn = countIn;
})(window.AB = (window.AB || {}));
