import { llmService } from './llmService.js';

export const FORMS_METADATA = {
    caste_cert: {
        id: "caste_cert",
        title: {
            en: "Application for Caste/Community Certificate",
            hi: "जाति/समुदाय प्रमाणपत्र के लिए आवेदन",
            te: "కులం/కమ్యూనిటీ సర్టిఫికేట్ కోసం దరఖాస్తు"
        },
        description: {
            en: "Used to obtain an official certificate verifying your community/caste category for reservation or scheme benefits.",
            hi: "आरक्षण या योजना के लाभों के लिए आपकी श्रेणी/जाति को सत्यापित करने वाला एक आधिकारिक प्रमाणपत्र प्राप्त करने के लिए उपयोग किया जाता है।",
            te: "రిజర్వేషన్ లేదా పథకం ప్రయోజనాల కోసం మీ కేటగిరీ/కులాన్ని ధృవీకరించే అధికారిక పత్రాన్ని పొందడానికి ఉపయోగించబడుతుంది."
        },
        fields: [
            { id: "name", label: { en: "Full Name", hi: "पूरा नाम", te: "పూర్తి పేరు" }, prefill: "name", type: "text" },
            { id: "father_name", label: { en: "Father's / Spouse's Name", hi: "पिता / जीवनसाथी का नाम", te: "తండ్రి / జీవిత భాగస్వామి పేరు" }, prefill: null, type: "text" },
            { id: "state", label: { en: "State", hi: "राज्य", te: "రాష్ట్రం" }, prefill: "state", type: "text" },
            { id: "district", label: { en: "District", hi: "ज़िला", te: "జిల్లా" }, prefill: "district", type: "text" },
            { id: "address", label: { en: "Permanent Address", hi: "स्थायी पता", te: "శాశ్వత చిరునామా" }, prefill: null, type: "text" },
            { id: "caste_category", label: { en: "Caste Category (SC/ST/OBC/General)", hi: "जाति वर्ग (SC/ST/OBC/सामान्य)", te: "కుల వర్గం (SC/ST/OBC/General)" }, prefill: null, type: "text" },
            { id: "sub_caste", label: { en: "Specific Sub-Caste/Tribe Name", hi: "विशिष्ट उप-जाति का नाम", te: "నిర్దిష్ట ఉప-కులం పేరు" }, prefill: null, type: "text" },
            { id: "reason", label: { en: "Purpose of Application", hi: "आवेदन का उद्देश्य", te: "దరఖాస్తు యొక్క ఉద్దేశం" }, prefill: null, type: "text" }
        ]
    },
    income_cert: {
        id: "income_cert",
        title: {
            en: "Application for Income Certificate",
            hi: "आय प्रमाणपत्र के लिए आवेदन",
            te: "ఆదాయ ధృవీకరణ పత్రం కోసం దరఖాస్తు"
        },
        description: {
            en: "Required to prove family annual income for school admissions, scholarships, or government scheme eligibility.",
            hi: "स्कूल प्रवेश, छात्रवृत्ति, या सरकारी योजना की पात्रता के लिए पारिवारिक वार्षिक आय साबित करने के लिए आवश्यक है।",
            te: "పాఠశాల ప్రవేశాలు, స్కాలర్‌షిప్‌లు లేదా ప్రభుత్వ పథకాల అర్హత కోసం కుటుంబ వార్షిక ఆదాయాన్ని నిరూపించడానికి అవసరం."
        },
        fields: [
            { id: "name", label: { en: "Full Name", hi: "पूरा नाम", te: "పూర్తి పేరు" }, prefill: "name", type: "text" },
            { id: "state", label: { en: "State", hi: "राज्य", te: "రాష్ట్రం" }, prefill: "state", type: "text" },
            { id: "district", label: { en: "District", hi: "ज़िला", te: "జిల్లా" }, prefill: "district", type: "text" },
            { id: "occupation", label: { en: "Occupation / Source of Income", hi: "व्यवसाय / आय का स्रोत", te: "వృత్తి / ఆదాయ మార్గం" }, prefill: "occupation", type: "text" },
            { id: "annual_income", label: { en: "Total Family Annual Income (in INR)", hi: "कुल पारिवारिक वार्षिक आय (रुपये में)", te: "మొత్తం కుటుంబ వార్షిక ఆదాయం (రూపాయలలో)" }, prefill: null, type: "text" },
            { id: "ration_card_number", label: { en: "Ration Card Number (optional)", hi: "राशन कार्ड नंबर (वैकल्पिक)", te: "రేషన్ కార్డ్ నంబర్ (ఐచ్ఛికం)" }, prefill: null, type: "text" },
            { id: "reason", label: { en: "Purpose of Certificate", hi: "प्रमाणपत्र का उद्देश्य", te: "ధృవీకరణ పత్రం యొక్క ఉద్దేశం" }, prefill: null, type: "text" }
        ]
    },
    pm_kisan: {
        id: "pm_kisan",
        title: {
            en: "PM-Kisan Samman Nidhi Application",
            hi: "पीएम-किसान सम्मान निधि आवेदन",
            te: "పీఎం-కిసాన్ సమ్మాన్ నిధి దరఖాస్తు"
        },
        description: {
            en: "Income support scheme of Rs. 6000/- per year for landholding farmer families across the country.",
            hi: "देश भर के भूमिधारक किसान परिवारों के लिए 6000 रुपये प्रति वर्ष की आय सहायता योजना।",
            te: "దేశవ్యాప్తంగా భూమి ఉన్న రైతు కుటుంబాలకు సంవత్సరానికి రూ. 6000/- ఆదాయ సహాయ పథకం."
        },
        fields: [
            { id: "name", label: { en: "Farmer's Full Name", hi: "किसान का पूरा नाम", te: "రైతు పూర్తి పేరు" }, prefill: "name", type: "text" },
            { id: "state", label: { en: "State", hi: "राज्य", te: "రాష్ట్రం" }, prefill: "state", type: "text" },
            { id: "district", label: { en: "District", hi: "ज़िला", te: "జिज्या" }, prefill: "district", type: "text" },
            { id: "aadhaar_number", label: { en: "Aadhaar Card Number (12 digits)", hi: "आधार कार्ड नंबर (12 अंक)", te: "ఆధార్ కార్డ్ నంబర్ (12 అంకెలు)" }, prefill: null, type: "text" },
            { id: "bank_account_number", label: { en: "Bank Account Number", hi: "बैंक खाता संख्या", te: "బ్యాంక్ ఖాతా సంఖ్య" }, prefill: null, type: "text" },
            { id: "ifsc_code", label: { en: "Bank IFSC Code", hi: "बैंक आईएफएससी कोड", te: "బ్యాంక్ IFSC కోడ్" }, prefill: null, type: "text" },
            { id: "land_area", label: { en: "Land Holding Size (in Hectares/Acres)", hi: "भूमि जोत का आकार (हेक्टेयर/एकड़ में)", te: "భూమి విస్తీర్ణం (హెక్టార్లు/ఎకరాలలో)" }, prefill: null, type: "text" },
            { id: "survey_number", label: { en: "Land Survey / Khata Number", hi: "भूमि सर्वेक्षण / खाता संख्या", te: "భూమి సర్వే / ఖాతా సంఖ్య" }, prefill: null, type: "text" }
        ]
    }
};

class FormService {
    getAvailableForms(lang = 'en') {
        const forms = [];
        for (const fid in FORMS_METADATA) {
            const form = FORMS_METADATA[fid];
            forms.push({
                id: fid,
                title: form.title[lang] || form.title.en,
                description: form.description[lang] || form.description.en
            });
        }
        return forms;
    }

    prefillFormFromProfile(formId, profile) {
        const form = FORMS_METADATA[formId];
        if (!form) return {};
        
        const values = {};
        for (const field of form.fields) {
            const fid = field.id;
            const prefillKey = field.prefill;
            if (prefillKey && profile && profile[prefillKey]) {
                values[fid] = profile[prefillKey];
            } else {
                values[fid] = '';
            }
        }
        return values;
    }

    async aiExtractFields(formId, currentValues, userMessage, lang = 'en', customApiKey = null, provider = 'gemini', ollamaUrl = null, ollamaModel = 'llama3') {
        const form = FORMS_METADATA[formId];
        if (!form) return currentValues;

        const fieldsDesc = [];
        for (const field of form.fields) {
            const label = field.label[lang] || field.label.en;
            fieldsDesc.push(`- ID: ${field.id}, Name: ${label}, Current Value: ${currentValues[field.id] || ''}`);
        }
        const fieldsStr = fieldsDesc.join('\n');

        const prompt = `
You are an advanced slot-filling entity. Your task is to extract information from a user's statement and map it to form fields.

Here are the target fields, their descriptions, and current values:
${fieldsStr}

User Statement: "${userMessage}"

Extract any information from the User Statement that fits into these fields. Return ONLY a valid JSON object mapping field IDs to their extracted values. Do not change values that are already present unless the User Statement explicitly updates them. Do not explain anything. Output only valid JSON.
Example format:
{
    "father_name": "Ramesh Kumar",
    "aadhaar_number": "123456789012"
}
`;

        try {
            const responseText = await llmService.generateResponse(
                prompt,
                "You are a strict JSON generator. Return ONLY JSON.",
                provider,
                customApiKey,
                ollamaUrl,
                ollamaModel
            );

            let cleanText = responseText.trim();
            if (cleanText.startsWith('```json')) {
                cleanText = cleanText.substring(7);
            }
            if (cleanText.endsWith('```')) {
                cleanText = cleanText.substring(0, cleanText.length - 3);
            }
            cleanText = cleanText.trim();

            const extracted = JSON.parse(cleanText);

            const updatedValues = { ...currentValues };
            for (const k in extracted) {
                if (k in updatedValues && extracted[k] !== undefined) {
                    updatedValues[k] = String(extracted[k]);
                }
            }
            return updatedValues;
        } catch (e) {
            console.error('aiExtractFields Error:', e.message);
            return currentValues;
        }
    }

    async generateFormalDraft(formId, values, lang = 'en', customApiKey = null, provider = 'gemini', ollamaUrl = null, ollamaModel = 'llama3') {
        const form = FORMS_METADATA[formId];
        if (!form) return '';

        const langNames = { en: 'English', hi: 'Hindi', te: 'Telugu' };
        const targetLang = langNames[lang.split('-')[0]] || 'English';

        let fieldsStr = '';
        for (const field of form.fields) {
            const fid = field.id;
            const label = field.label[lang] || field.label.en;
            const val = values[fid] || 'Not Provided';
            fieldsStr += `${label}: ${val}\n`;
        }

        const prompt = `
You are an expert administrative clerk. Create a professional, formal application draft based on the following form values.
Form Name: ${form.title[lang] || form.title.en}
Preferred Language: ${targetLang}

Values extracted:
${fieldsStr}

Please generate a highly professional, polite, and complete application letter or draft in ${targetLang}. The document should look ready to print or submit to the local Tahsildar / Panchayat / Government office. Include placeholders for signature and date. Ensure correct local terminology is used (e.g. Hindi/Telugu terms for official addresses if relevant).
`;

        try {
            return await llmService.generateResponse(
                prompt,
                "Create a formal and structured official document draft. Do not add conversational remarks.",
                provider,
                customApiKey,
                ollamaUrl,
                ollamaModel
            );
        } catch (e) {
            console.error('generateFormalDraft Error:', e.message);
            return `Error generating formal draft: ${e.message}\n\nHere are the filled details:\n\n${fieldsStr}`;
        }
    }
}

export const formService = new FormService();
