# Gram Sahayak AI – Rural Service Assistant

Gram Sahayak AI is a multilingual, retrieval-augmented generation (RAG) assistant specifically designed to help rural citizens understand, navigate, and access government services, welfare schemes, certificate requisites, and official application forms. It supports English, Hindi, and Telugu.

---

## Features
- **Multilingual Support (i18n)**: Interface text is dynamically translated using external JSON localization files (`locales/`).
- **AI Providers (BYOK)**: Supports Google Gemini API (Bring Your Own Key) or local offline execution through Ollama (e.g. Llama3, Mistral).
- **Authentication**: Built-in login and sign-up flows using Supabase Authentication, storing user attributes like state, district, occupation, and language preference.
- **RAG Pipeline**: Upload scheme brochures or PDFs, split text into semantic chunks, embed with `text-embedding-004`, and store inside Supabase pgvector. 
- **Interactive Form Filling Helper**: Automates rural certificate drafts (Caste Certificate, Income Certificate, PM-Kisan) using profile attributes, letting users type natural speech/statements to fill out empty form items.
- **Source Citations**: Clearly highlights references to source PDFs used in RAG responses.
- **Export History**: Download chat logs as a beautifully formatted PDF.

---

## Project Structure
```text
Gram Sayak AI/
├── locales/                    # Translation files
│   ├── en.json                 # English
│   ├── hi.json                 # Hindi
│   └── te.json                 # Telugu
├── services/                   # Modular Services Layer
│   ├── auth_service.py         # Supabase Authentication
│   ├── embedding_service.py    # Gemini Text Embeddings (768d)
│   ├── llm_service.py          # Gemini & Ollama inference
│   ├── translation_service.py  # Localization utility
│   ├── supabase_service.py     # Database queries & file storage
│   ├── pdf_service.py          # PDF text extraction & PDF generation
│   ├── form_service.py         # AI slot-filling & document drafting
│   └── rag_service.py          # Vector query & context retrieval
├── app.py                      # Streamlit application entry point
├── requirements.txt            # Package dependencies
├── schema.sql                  # Supabase PostgreSQL schema
├── .env.example                # Template for environment settings
└── README.md                   # This instruction guide
```

---

## Setup & Configuration

### 1. Database Setup (Supabase)
1. Go to your [Supabase Dashboard](https://supabase.com) and open the SQL Editor.
2. Open the `schema.sql` file in this repository, copy its content, and execute it in your SQL Editor. This will:
   - Enable the `vector` extension.
   - Create tables (`profiles`, `documents`, `document_chunks`, `chats`, `messages`).
   - Enable RLS policies for database security.
   - Deploy the similarity match RPC function (`match_document_chunks`).

### 2. Environment Configuration
Create a `.env` file in the root folder of the project by copying `.env.example`:
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Gemini API Key (Required for RAG embeddings and Gemini generation)
GEMINI_API_KEY=your-gemini-api-key

# Ollama Endpoint
OLLAMA_HOST=http://localhost:11434
```

### 3. Local Execution
1. Install Python 3.10+ (this project is tested on Python 3.13).
2. Install dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```
3. Run the Streamlit server:
   ```bash
   python -m streamlit run app.py
   ```
4. Access the web client in your browser: `http://localhost:8501`.

---

## Running Local AI Models (Ollama)
To run the assistant completely offline or using local models:
1. Download and run [Ollama](https://ollama.com).
2. Pull your model of choice:
   ```bash
   ollama pull llama3
   ```
3. Ensure Ollama is running (`http://localhost:11434`), switch the provider in the **Settings** sidebar of the app to **Ollama (Local)**, select `llama3` (or your model), and start chatting!
*(Note: Google Gemini API is still recommended for text embeddings to maximize retrieval accuracy).*
