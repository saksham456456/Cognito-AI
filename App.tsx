import React, { useState, useEffect, useRef } from 'react';
import { startChat, getTitleForChat } from './services/geminiService';
import { saveChat, loadChats, deleteChat, deleteAllChats } from './services/dbService';
import type { Message, Chat, AiMode, AppView } from './types';
import MessageComponent from './components/Message';
import ChatInput from './components/ChatInput';
import { CognitoLogo } from './components/Logo';
import Sidebar from './components/Sidebar';
import { MenuIcon } from './components/icons';
import ProfileModal from './components/ProfileModal';
import LoadingScreen from './components/LoadingScreen';
import AboutModal from './components/AboutModal';
import ConfirmationModal from './components/ConfirmationModal';
import BackgroundCanvas from './components/BackgroundCanvas';
import CoreLoadingScreen from './components/CoreLoadingScreen';
import CodingPlayground from './components/CodingPlayground';
import CoreDisintegrationScreen from './components/CoreDisintegrationScreen';

const translations: any = {
  en: {
    sidebar: { title: "COGNITO", newSession: "New Session", searchLogs: "Search logs...", background: "Background", about: "About Cognito AI", exportLog: "Export Log", purgeLogs: "Purge All Logs", profileName: "Operator", language: "Language" },
    chatInput: { placeholderCognito: "Message Cognito...", placeholderCode: "Ask a coding question...", shiftEnter: "Shift + Enter for a new line.", suggestions: ["Give me ideas for a sci-fi story", "Explain quantum computing simply", "Write a futuristic poem"], modeCognito: "Cognito", modeCognitoDesc: "Your general purpose AI assistant.", modeCode: "Code Assistant", modeCodeDesc: "For programming and technical queries.", selectMode: "SELECT MODE" },
    welcome: { greeting: "Welcome, {{name}}", prompt: "How can I help you navigate the digital cosmos today?" },
    modals: { aboutTitle: "About Cognito AI", aboutSubtitle: "Your Personal AI Assistant", aboutLine1: "{{link}} is a modern, responsive AI assistant crafted to provide intelligent answers and a premium user experience.", aboutLine1Link: "Cognito AI", aboutLine2: "This application was developed by {{link}}, a passionate frontend engineer with a knack for creating beautiful, functional user interfaces.", aboutLine2Link: "Saksham", aboutLine3: "It is fueled by {{link}}, curiosity in ML & DBMS, and his interests.", aboutLine3Link: "Saksham's knowledge", profileTitle: "Operator Profile", profileSubtitle: "Update your callsign.", profileLabel: "Callsign", profilePlaceholder: "Enter your callsign", confirmPurgeTitle: "Purge All Logs?", confirmPurgeMessage: "This will permanently delete all conversation logs. This action cannot be undone.", confirmPurgeButton: "Purge All", save: "Save Changes", cancel: "Cancel", close: "Close" },
    app: { newChatTitle: "New Conversation", newCodingSessionTitle: "New Coding Session", defaultChatTitle: "Cognito AI Assistant" },
    coding: { title: "Coding Core", exit: "Exit Core", run: "RUN >", executing: "EXECUTING...", initializing: "INITIALIZING...", copyCode: "Copy Code", copied: "Copied!", consoleHeader: "/console.log", assistantHeader: "/assistant.ai", awaitingExecution: "[Awaiting execution...]", assistantPlaceholder: "Ask a question..." },
    loading: { bootLog: ["[INITIATING] COGNITO OS v2.1", "[LOADING]    PERSONALITY_MATRIX.DAT", "[CALIBRATING] HEURISTIC_PROCESSORS", "[ESTABLISHING] SECURE_CHANNEL_TO_USER", "[STATUS]     ALL SYSTEMS NOMINAL."] },
    coreLoading: { title: "INITIALIZING CODE CORE", bootLog: ["[SYS] BOOT SEQUENCE INITIATED...", "[MEM] VIRTUAL MEMORY ALLOCATED", "[CPU] PROCESSOR KERNELS ONLINE", "[NET] SECURE LINK ESTABLISHED", "[ENV] RUNTIME ENVIRONMENT CALIBRATED", "[UI] INTEGRATING GRAPHICAL SHELL...", "[OK] CORE INITIALIZATION COMPLETE."] },
    coreDisintegration: { title: "DISENGAGING CODING CORE", shutdownLog: ["[SYS] SHUTDOWN SEQUENCE INITIATED...", "[MEM] VIRTUAL MEMORY DEALLOCATED", "[CPU] RELEASING PROCESSOR KERNELS", "[NET] SECURE LINK TERMINATED", "[UI] DISENGAGING GRAPHICAL SHELL...", "[OK] CORE SHUTDOWN COMPLETE.", "[SYS] RETURNING TO COGNITO INTERFACE."] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  es: {
    sidebar: { title: "COGNITO", newSession: "Nueva Sesión", searchLogs: "Buscar registros...", background: "Fondo", about: "Acerca de Cognito AI", exportLog: "Exportar Registro", purgeLogs: "Purgar Registros", profileName: "Operador", language: "Idioma" },
    chatInput: { placeholderCognito: "Mensaje a Cognito...", placeholderCode: "Haz una pregunta de código...", shiftEnter: "Shift + Enter para nueva línea.", suggestions: ["Dame ideas para una historia de ciencia ficción", "Explica la computación cuántica de forma sencilla", "Escribe un poema futurista"], modeCognito: "Cognito", modeCognitoDesc: "Tu asistente de IA de propósito general.", modeCode: "Asistente de Código", modeCodeDesc: "Para consultas técnicas y de programación.", selectMode: "SELECCIONAR MODO" },
    welcome: { greeting: "Bienvenido, {{name}}", prompt: "¿Cómo puedo ayudarte a navegar el cosmos digital hoy?" },
    modals: { aboutTitle: "Acerca de Cognito AI", aboutSubtitle: "Tu Asistente Personal de IA", aboutLine1: "{{link}} es un asistente de IA moderno y receptivo, diseñado para proporcionar respuestas inteligentes y una experiencia de usuario premium.", aboutLine1Link: "Cognito AI", aboutLine2: "Esta aplicación fue desarrollada por {{link}}, un apasionado ingeniero de frontend con un don para crear interfaces de usuario hermosas y funcionales.", aboutLine2Link: "Saksham", aboutLine3: "Está impulsado por {{link}}, su curiosidad en ML y SGBD, y sus intereses.", aboutLine3Link: "el conocimiento de Saksham", profileTitle: "Perfil de Operador", profileSubtitle: "Actualiza tu indicativo.", profileLabel: "Indicativo", profilePlaceholder: "Introduce tu indicativo", confirmPurgeTitle: "¿Purgar Todos los Registros?", confirmPurgeMessage: "Esto eliminará permanentemente todos los registros de conversación. Esta acción no se puede deshacer.", confirmPurgeButton: "Purgar Todo", save: "Guardar Cambios", cancel: "Cancelar", close: "Cerrar" },
    app: { newChatTitle: "Nueva Conversación", newCodingSessionTitle: "Nueva Sesión de Código", defaultChatTitle: "Asistente Cognito AI" },
    coding: { title: "Núcleo de Código", exit: "Salir del Núcleo", run: "EJECUTAR >", executing: "EJECUTANDO...", initializing: "INICIALIZANDO...", copyCode: "Copiar Código", copied: "¡Copiado!", consoleHeader: "/consola.log", assistantHeader: "/asistente.ai", awaitingExecution: "[Esperando ejecución...]", assistantPlaceholder: "Haz una pregunta..." },
    loading: { bootLog: ["[INICIANDO] COGNITO OS v2.1", "[CARGANDO]   MATRIZ_DE_PERSONALIDAD.DAT", "[CALIBRANDO] PROCESADORES_HEURÍSTICOS", "[ESTABLECIENDO] CANAL_SEGURO_AL_USUARIO", "[ESTADO]     TODOS LOS SISTEMAS NOMINALES."] },
    coreLoading: { title: "INICIALIZANDO NÚCLEO DE CÓDIGO", bootLog: ["[SIS] SECUENCIA DE ARRANQUE INICIADA...", "[MEM] MEMORIA VIRTUAL ASIGNADA", "[CPU] NÚCLEOS DE PROCESADOR EN LÍNEA", "[RED] ENLACE SEGURO ESTABLECIDO", "[ENT] ENTORNO DE EJECUCIÓN CALIBRADO", "[UI] INTEGRANDO SHELL GRÁFICO...", "[OK] INICIALIZACIÓN DEL NÚCLEO COMPLETA."] },
    coreDisintegration: { title: "DESCONECTANDO NÚCLEO DE CÓDIGO", shutdownLog: ["[SIS] SECUENCIA DE APAGADO INICIADA...", "[MEM] MEMORIA VIRTUAL DESASIGNADA", "[CPU] LIBERANDO NÚCLEOS DE PROCESADOR", "[RED] ENLACE SEGURO TERMINADO", "[UI] DESCONECTANDO SHELL GRÁFICO...", "[OK] APAGADO DEL NÚCLEO COMPLETO.", "[SIS] VOLVIENDO A LA INTERFAZ DE COGNITO."] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  hi: {
    sidebar: { title: "COGNITO", newSession: "नया सत्र", searchLogs: "लॉग खोजें...", background: "पृष्ठभूमि", about: "कॉग्निटो एआई के बारे में", exportLog: "लॉग निर्यात करें", purgeLogs: "सभी लॉग हटाएं", profileName: "ऑपरेटर", language: "भाषा" },
    chatInput: { placeholderCognito: "कॉग्निटो को संदेश भेजें...", placeholderCode: "कोडिंग प्रश्न पूछें...", shiftEnter: "नई लाइन के लिए Shift + Enter दबाएं।", suggestions: ["मुझे एक विज्ञान-कथा कहानी के लिए विचार दें", "क्वांटम कंप्यूटिंग को सरल शब्दों में समझाएं", "एक भविष्यवादी कविता लिखें"], modeCognito: "कॉग्निटो", modeCognitoDesc: "आपका सामान्य प्रयोजन एआई सहायक।", modeCode: "कोड सहायक", modeCodeDesc: "प्रोग्रामिंग और तकनीकी प्रश्नों के लिए।", selectMode: "मोड चुनें" },
    welcome: { greeting: "आपका स्वागत है, {{name}}", prompt: "आज मैं डिजिटल ब्रह्मांड में आपकी कैसे मदद कर सकता हूँ?" },
    modals: { aboutTitle: "कॉग्निटो एआई के बारे में", aboutSubtitle: "आपका व्यक्तिगत एआई सहायक", aboutLine1: "{{link}} एक आधुनिक, उत्तरदायी एआई सहायक है जिसे बुद्धिमान उत्तर और एक प्रीमियम उपयोगकर्ता अनुभव प्रदान करने के लिए तैयार किया गया है।", aboutLine1Link: "कॉग्निटो एआई", aboutLine2: "यह एप्लिकेशन {{link}} द्वारा विकसित किया गया था, जो सुंदर, कार्यात्मक यूजर इंटरफेस बनाने की कला के साथ एक उत्साही फ्रंटएंड इंजीनियर है।", aboutLine2Link: "सक्षम", aboutLine3: "यह {{link}}, एमएल और डीबीएमएस में जिज्ञासा, और उनकी रुचियों से प्रेरित है।", aboutLine3Link: "सक्षम के ज्ञान", profileTitle: "ऑपरेटर प्रोफाइल", profileSubtitle: "अपना कॉलसाइन अपडेट करें।", profileLabel: "कॉलसाइन", profilePlaceholder: "अपना कॉलसाइन दर्ज करें", confirmPurgeTitle: "सभी लॉग हटाएं?", confirmPurgeMessage: "यह सभी वार्तालाप लॉग को स्थायी रूप से हटा देगा। यह क्रिया पूर्ववत नहीं की जा सकती।", confirmPurgeButton: "सभी हटाएं", save: "बदलाव सहेजें", cancel: "रद्द करें", close: "बंद करें" },
    app: { newChatTitle: "नई बातचीत", newCodingSessionTitle: "नया कोडिंग सत्र", defaultChatTitle: "कॉग्निटो एआई सहायक" },
    coding: { title: "कोडिंग कोर", exit: "कोर से बाहर निकलें", run: "चलाएं >", executing: "निष्पादित हो रहा है...", initializing: "शुरू हो रहा है...", copyCode: "कोड कॉपी करें", copied: "कॉपी किया गया!", consoleHeader: "/console.log", assistantHeader: "/assistant.ai", awaitingExecution: "[निष्पादन की प्रतीक्षा में...]", assistantPlaceholder: "एक प्रश्न पूछें..." },
    loading: { bootLog: ["[प्रारंभ] कॉग्निटो ओएस v2.1", "[लोड हो रहा है] पर्सनैलिटी_मैट्रिक्स.डैट", "[कैलिब्रेटिंग] ह्यूरिस्टिक_प्रोसेसर", "[स्थापित] उपयोगकर्ता के लिए सुरक्षित चैनल", "[स्थिति] सभी सिस्टम सामान्य हैं।"] },
    coreLoading: { title: "कोडिंग कोर शुरू हो रहा है", bootLog: ["[सिस्टम] बूट अनुक्रम शुरू...", "[मेमोरी] वर्चुअल मेमोरी आवंटित", "[सीपीयू] प्रोसेसर कर्नेल ऑनलाइन", "[नेट] सुरक्षित लिंक स्थापित", "[ईएनवी] रनटाइम वातावरण कैलिब्रेटेड", "[यूआई] ग्राफिकल शेल को एकीकृत करना...", "[ठीक है] कोर आरंभीकरण पूर्ण।"] },
    coreDisintegration: { title: "कोडिंग कोर को निष्क्रिय करना", shutdownLog: ["[सिस्टम] शटडाउन अनुक्रम शुरू...", "[मेमोरी] वर्चुअल मेमोरी डीलोकेटेड", "[सीपीयू] प्रोसेसर कर्नेल जारी करना", "[नेट] सुरक्षित लिंक समाप्त", "[यूआई] ग्राफिकल शेल को निष्क्रिय करना...", "[ठीक है] कोर शटडाउन पूर्ण।", "[सिस्टम] कॉग्निटो इंटरफ़ेस पर लौटना।"] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  fr: {
    sidebar: { title: "COGNITO", newSession: "Nouvelle Session", searchLogs: "Rechercher les journaux...", background: "Arrière-plan", about: "À propos de Cognito AI", exportLog: "Exporter le journal", purgeLogs: "Purger tous les journaux", profileName: "Opérateur", language: "Langue" },
    chatInput: { placeholderCognito: "Message à Cognito...", placeholderCode: "Posez une question de code...", shiftEnter: "Maj + Entrée pour une nouvelle ligne.", suggestions: ["Donnez-moi des idées d'histoire de SF", "Expliquez l'informatique quantique", "Écrivez un poème futuriste"], modeCognito: "Cognito", modeCognitoDesc: "Votre assistant IA à usage général.", modeCode: "Assistant de Code", modeCodeDesc: "Pour les requêtes de programmation et techniques.", selectMode: "SÉLECTIONNER LE MODE" },
    welcome: { greeting: "Bienvenue, {{name}}", prompt: "Comment puis-je vous aider à naviguer dans le cosmos numérique aujourd'hui ?" },
    modals: { aboutTitle: "À propos de Cognito AI", aboutSubtitle: "Votre Assistant Personnel IA", aboutLine1: "{{link}} est un assistant IA moderne et réactif, conçu pour fournir des réponses intelligentes et une expérience utilisateur de premier ordre.", aboutLine1Link: "Cognito AI", aboutLine2: "Cette application a été développée par {{link}}, un ingénieur frontend passionné avec un talent pour créer des interfaces utilisateur belles et fonctionnelles.", aboutLine2Link: "Saksham", aboutLine3: "Elle est alimentée par {{link}}, sa curiosité pour le ML & SGBD, et ses intérêts.", aboutLine3Link: "les connaissances de Saksham", profileTitle: "Profil de l'Opérateur", profileSubtitle: "Mettez à jour votre indicatif.", profileLabel: "Indicatif", profilePlaceholder: "Entrez votre indicatif", confirmPurgeTitle: "Purger tous les journaux ?", confirmPurgeMessage: "Cela supprimera définitivement tous les journaux de conversation. Cette action est irréversible.", confirmPurgeButton: "Tout purger", save: "Enregistrer", cancel: "Annuler", close: "Fermer" },
    app: { newChatTitle: "Nouvelle Conversation", newCodingSessionTitle: "Nouvelle Session de Codage", defaultChatTitle: "Assistant Cognito AI" },
    coding: { title: "Noyau de Codage", exit: "Quitter le Noyau", run: "EXÉCUTER >", executing: "EXÉCUTION...", initializing: "INITIALISATION...", copyCode: "Copier le Code", copied: "Copié !", consoleHeader: "/console.log", assistantHeader: "/assistant.ai", awaitingExecution: "[En attente d'exécution...]", assistantPlaceholder: "Posez une question..." },
    loading: { bootLog: ["[INITIALISATION] COGNITO OS v2.1", "[CHARGEMENT]   MATRICE_PERSONNALITÉ.DAT", "[CALIBRAGE]    PROCESSEURS_HEURISTIQUES", "[ÉTABLISSEMENT] CANAL_SÉCURISÉ_VERS_UTILISATEUR", "[STATUT]       TOUS_SYSTÈMES_NOMINAUX."] },
    coreLoading: { title: "INITIALISATION DU NOYAU DE CODAGE", bootLog: ["[SYS] SÉQUENCE DE DÉMARRAGE INITIÉE...", "[MEM] MÉMOIRE VIRTUELLE ALLOUÉE", "[CPU] COEURS DE PROCESSEUR EN LIGNE", "[NET] LIAISON SÉCURISÉE ÉTABLIE", "[ENV] ENVIRONNEMENT D'EXÉCUTION CALIBRÉ", "[UI] INTÉGRATION DE L'INTERFACE GRAPHIQUE...", "[OK] INITIALISATION DU NOYAU TERMINÉE."] },
    coreDisintegration: { title: "DÉSENGAGEMENT DU NOYAU DE CODAGE", shutdownLog: ["[SYS] SÉQUENCE D'ARRÊT INITIÉE...", "[MEM] MÉMOIRE VIRTUELLE DÉSALLOUÉE", "[CPU] LIBÉRATION DES COEURS DE PROCESSEUR", "[NET] LIAISON SÉCURISÉE TERMINÉE", "[UI] DÉSENGAGEMENT DE L'INTERFACE GRAPHIQUE...", "[OK] ARRÊT DU NOYAU TERMINÉ.", "[SYS] RETOUR À L'INTERFACE COGNITO."] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  sa: {
    sidebar: { title: "COGNITO", newSession: "नवीनं सत्रम्", searchLogs: "अभिलेखान्वेषणम्...", background: "पृष्ठभूमिः", about: "कोग्निटो एआई विषये", exportLog: "अभिलेखं निर्यातं कुरु", purgeLogs: "सर्वाणि अभिलेखानि निष्कासय", profileName: "प्रचालकः", language: "भाषा" },
    chatInput: { placeholderCognito: "कोग्निटो कृते सन्देशः...", placeholderCode: "कूटलेखनप्रश्नं पृच्छतु...", shiftEnter: "नवीनपङ्क्तये Shift + Enter", suggestions: ["विज्ञान-कथा-विचारान् ददातु", "क्वाण्टम्-कम्प्यूटिंग् सरलं वर्णयतु", "भविष्यत्-कवितां लिखतु"], modeCognito: "कोग्निटो", modeCognitoDesc: "भवतः सामान्यप्रयोजन-एआई-सहायकः।", modeCode: "कूट-सहायकः", modeCodeDesc: "कार्यक्रमणाय, तान्त्रिकप्रश्नेभ्यश्च।", selectMode: "विधिं चिनोतु" },
    welcome: { greeting: "स्वागतम्, {{name}}", prompt: "अद्य अहं डिजिटल-जगति कथं साहाय्यं करवाणि?" },
    modals: { aboutTitle: "कोग्निटो एआई विषये", aboutSubtitle: "भवतः व्यक्तिगतः एआई सहायकः", aboutLine1: "{{link}} एकः आधुनिकः, प्रतिक्रियाशीलः एआई सहायकः अस्ति यः बुद्धिमत्-उत्तराणि, उत्तम-उपयोक्तृ-अनुभवं च प्रदातुं निर्मितः।", aboutLine1Link: "कोग्निटो एआई", aboutLine2: "इदं अनुप्रयोगं {{link}}-द्वारा विकसितम्, यः सुन्दर-क्रियाशील-उपयोक्तृ-अन्तरापृष्ठानि निर्मातुं कुशलः उत्साही फ्रन्टएण्ड-अभियन्ता अस्ति।", aboutLine2Link: "सक्षम", aboutLine3: "इदं {{link}}, एमएल-डीबीएमएस-मध्ये तस्य जिज्ञासया, तस्य रुचिभिश्च चालितम्।", aboutLine3Link: "सक्षमस्य ज्ञानेन", profileTitle: "प्रचालक-विवरणम्", profileSubtitle: "भवतः आह्वानचिह्नं नूतनीकरोतु।", profileLabel: "आह्वानचिह्नम्", profilePlaceholder: "आह्वानचिह्नं लिखतु", confirmPurgeTitle: "सर्वाणि अभिलेखानि निष्कासयितुं इच्छति वा?", confirmPurgeMessage: "एतेन सर्वाणि वार्तालाप-अभिलेखानि स्थायिरूपेण विलोप्स्यन्ते। एतत् कार्यं प्रतिवर्तयितुं न शक्यते।", confirmPurgeButton: "सर्वाणि निष्कासय", save: "संरक्षतु", cancel: "रद्दं करोतु", close: "पिदधातु" },
    app: { newChatTitle: "नवीनः वार्तालापः", newCodingSessionTitle: "नवीनं कूटलेखनसत्रम्", defaultChatTitle: "कोग्निटो एआई सहायकः" },
    coding: { title: "कूटलेखन-केन्द्रम्", exit: "केन्द्रात् निर्गच्छतु", run: "चालयतु >", executing: "निष्पाद्यमानम्...", initializing: "आरभ्यमाणम्...", copyCode: "कूटं प्रतिलिपिं करोतु", copied: "प्रतिलिपिः कृता!", consoleHeader: "/console.log", assistantHeader: "/assistant.ai", awaitingExecution: "[निष्पादनं प्रतीक्षमाणम्...]", assistantPlaceholder: "प्रश्नं पृच्छतु..." },
    loading: { bootLog: ["[प्रारम्भः] कोग्निटो ओएस v2.1", "[भारणम्]   व्यक्तित्व-मैट्रिक्स.डैट", "[समंजनम्]   अनुमानात्मक-प्रसंसाधकाः", "[स्थापनम्]   उपयोक्त्रे सुरक्षित-चैनलम्", "[स्थितिः]     सर्वाणि तन्त्राणि सामान्यनि।"] },
    coreLoading: { title: "कूटलेखन-केन्द्रम् आरभ्यते", bootLog: ["[तन्त्रम्] बूट्-अनुक्रमः आरब्धः...", "[स्मृतिः] आभासी स्मृतिः वितरिता", "[सीपीयू] प्रोसेसर-केन्द्रकाणि ऑनलाइन्", "[जालम्] सुरक्षित-सम्पर्कः स्थापितः", "[पर्यावरणम्] रनटाइम-पर्यावरणं समंजितम्", "[यूआई] ग्राफिकल-शेल् एकीकृतम्...", "[ओके] केन्द्र-आरम्भः पूर्णः।"] },
    coreDisintegration: { title: "कूटलेखन-केन्द्रं वियोज्यते", shutdownLog: ["[तन्त्रम्] शटडाउन-अनुक्रमः आरब्धः...", "[स्मृतिः] आभासी स्मृतिः अविभाजिता", "[सीपीयू] प्रोसेसर-केन्द्रकाणि मुक्तानि", "[जालम्] सुरक्षित-सम्पर्कः समाप्तः", "[यूआई] ग्राफिकल-शेल् वियोजितम्...", "[ओके] केन्द्र-शटडाउन पूर्णम्।", "[तन्त्रम्] कोग्निटो-अन्तरापृष्ठं प्रति गमनम्।"] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  'hi-en': {
    sidebar: { title: "COGNITO", newSession: "New Session", searchLogs: "Logs search karo...", background: "Background", about: "Cognito AI ke baare mein", exportLog: "Log Export karo", purgeLogs: "Saare Logs hatao", profileName: "Operator", language: "Language" },
    chatInput: { placeholderCognito: "Cognito ko message bhejo...", placeholderCode: "Coding ka sawaal pucho...", shiftEnter: "Nayi line ke liye Shift + Enter.", suggestions: ["Sci-fi story ke liye ideas do", "Quantum computing aasan se samjhao", "Ek futuristic poem likho"], modeCognito: "Cognito", modeCognitoDesc: "Aapka general purpose AI assistant.", modeCode: "Code Assistant", modeCodeDesc: "Programming aur technical sawaalon ke liye.", selectMode: "MODE SELECT KARO" },
    welcome: { greeting: "Welcome, {{name}}", prompt: "Aaj digital duniya mein main aapki kaise help kar sakta hoon?" },
    modals: { aboutTitle: "Cognito AI ke baare mein", aboutSubtitle: "Aapka Personal AI Assistant", aboutLine1: "{{link}} ek modern, responsive AI assistant hai jo intelligent answers aur premium user experience ke liye banaya gaya hai.", aboutLine1Link: "Cognito AI", aboutLine2: "Yeh application {{link}} ne develop ki hai, jo ek passionate frontend engineer hain aur sundar, functional user interfaces banane mein mahir hain.", aboutLine2Link: "Saksham", aboutLine3: "Yeh {{link}}, ML & DBMS mein unki curiosity, aur unke interests se chalti hai.", aboutLine3Link: "Saksham ke knowledge", profileTitle: "Operator Profile", profileSubtitle: "Apna callsign update karo.", profileLabel: "Callsign", profilePlaceholder: "Apna callsign daalo", confirmPurgeTitle: "Saare Logs Hata dein?", confirmPurgeMessage: "Isse saare conversation logs hamesha ke liye delete ho jayenge. Yeh action undo nahi ho sakta.", confirmPurgeButton: "Sab Hatao", save: "Save Karein", cancel: "Cancel", close: "Close" },
    app: { newChatTitle: "Nayi Conversation", newCodingSessionTitle: "Naya Coding Session", defaultChatTitle: "Cognito AI Assistant" },
    coding: { title: "Coding Core", exit: "Core se Exit", run: "RUN >", executing: "EXECUTING...", initializing: "INITIALIZING...", copyCode: "Code Copy Karo", copied: "Copied!", consoleHeader: "/console.log", assistantHeader: "/assistant.ai", awaitingExecution: "[Execution ka intezaar...]", assistantPlaceholder: "Sawaal pucho..." },
    loading: { bootLog: ["[INITIATING] COGNITO OS v2.1", "[LOADING]    PERSONALITY_MATRIX.DAT", "[CALIBRATING] HEURISTIC_PROCESSORS", "[ESTABLISHING] SECURE_CHANNEL_TO_USER", "[STATUS]     ALL SYSTEMS NOMINAL."] },
    coreLoading: { title: "INITIALIZING CODE CORE", bootLog: ["[SYS] BOOT SEQUENCE INITIATED...", "[MEM] VIRTUAL MEMORY ALLOCATED", "[CPU] PROCESSOR KERNELS ONLINE", "[NET] SECURE LINK ESTABLISHED", "[ENV] RUNTIME ENVIRONMENT CALIBRATED", "[UI] INTEGRATING GRAPHICAL SHELL...", "[OK] CORE INITIALIZATION COMPLETE."] },
    coreDisintegration: { title: "DISENGAGING CODING CORE", shutdownLog: ["[SYS] SHUTDOWN SEQUENCE INITIATED...", "[MEM] VIRTUAL MEMORY DEALLOCATED", "[CPU] RELEASING PROCESSOR KERNELS", "[NET] SECURE LINK TERMINATED", "[UI] DISENGAGING GRAPHICAL SHELL...", "[OK] CORE SHUTDOWN COMPLETE.", "[SYS] RETURNING TO COGNITO INTERFACE."] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  }
};

const App: React.FC = () => {
    // Defining state variables using the useState hook.
    const [isAiLoading, setIsAiLoading] = useState(false); // Is the AI generating a response?
    const [chats, setChats] = useState<Chat[]>([]); // Array of all chats.
    const [activeChatId, setActiveChatId] = useState<string | null>(null); // The ID of the currently open chat.
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Is the sidebar open on mobile?
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null); // Which message is being spoken by text-to-speech.
    const [userName, setUserName] = useState(() => localStorage.getItem('userName') || 'Operator'); // The user's name, loaded from localStorage.
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // Is the profile modal open?
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false); // Is the about modal open?
    const [isConfirmDeleteAllOpen, setIsConfirmDeleteAllOpen] = useState(false); // Is the "Delete all" confirmation modal open?
    const [isDbLoading, setIsDbLoading] = useState(true); // Are chats being loaded from the database?
    const [backgroundAnimation, setBackgroundAnimation] = useState<string>(() => localStorage.getItem('backgroundAnimation') || 'particles'); // Background animation type.
    const [aiMode, setAiMode] = useState<AiMode>('cognito'); // Current AI mode.
    const [inputRect, setInputRect] = useState<DOMRect | null>(null); // Position of the input bar.
    const [locale, setLocale] = useState<string>(() => localStorage.getItem('locale') || 'en');
    
    // App view management states
    const [currentView, setCurrentView] = useState<AppView>('chat');
    const [isTransitioning, setIsTransitioning] = useState(false); // For entering the core
    const [isExiting, setIsExiting] = useState(false); // For exiting the core
    
    // Using useRef hooks to store DOM elements or persistent values.
    const messagesEndRef = useRef<HTMLDivElement>(null); // Reference to scroll to the end of the chat.
    const saveTimeoutRef = useRef<number | null>(null); // Debounce timer for saving the chat.
    const chatsRef = useRef(chats); // Holds the current value of the chats state to avoid stale closures.
    const stopGenerationRef = useRef(false); // Flag to stop the AI response stream.
    chatsRef.current = chats;

    // Finding the active chat from the chats array.
    const activeChat = chats.find(c => c.id === activeChatId);
    
    // Translation function
    const t = (key: string): any => {
        const keys = key.split('.');
        let result = translations[locale];
        for (const k of keys) {
            if (result) {
                result = result[k];
            } else {
                return key; // Return key if path is invalid
            }
        }
        return result || key;
    };


     // This useEffect hook runs when the component mounts.
     useEffect(() => {
        // Setting the dark theme by default.
        document.documentElement.classList.add('dark');
    }, []);

    // This useEffect loads chats from IndexedDB when the app starts.
    useEffect(() => {
        const init = async () => {
            try {
                const startTime = Date.now();
                const loadedChats = await loadChats();
                setChats(loadedChats);
                if (loadedChats.length > 0) {
                    setActiveChatId(loadedChats[0].id); // Set the first chat as active.
                }
                const elapsedTime = Date.now() - startTime;
                const minLoadingTime = 4000; // Show the loading screen for a minimum of 4.0 seconds.
                if (elapsedTime < minLoadingTime) {
                    await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
                }
            } catch (error) {
                console.error("Failed to load chats from the database:", error);
            } finally {
                setIsDbLoading(false); // Set the loading state to false.
            }
        };
        init();
    }, []);

    // Whenever userName changes, save it to localStorage.
    useEffect(() => {
        localStorage.setItem('userName', userName);
    }, [userName]);

    // Save the background animation choice to localStorage.
    useEffect(() => {
        localStorage.setItem('backgroundAnimation', backgroundAnimation);
    }, [backgroundAnimation]);

     // Save locale to localStorage
    useEffect(() => {
        localStorage.setItem('locale', locale);
    }, [locale]);

    // This useEffect saves the active chat to the DB whenever its messages or title change.
    // Debouncing (setTimeout) is used to avoid saving on every small change.
    useEffect(() => {
        if (!activeChat || isDbLoading) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = window.setTimeout(() => {
            const chatToSave = chatsRef.current.find(c => c.id === activeChat.id);
            if (chatToSave) {
                saveChat(chatToSave).catch(error => console.error("Failed to save chat:", error));
            }
        }, 500); // Saves after a 500ms delay.

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [activeChat?.messages, activeChat?.title, isDbLoading]);
    
    // Scroll the view down whenever a new message arrives.
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeChat?.messages]);
    
    const handleStopGeneration = () => {
        stopGenerationRef.current = true;
        setIsAiLoading(false);
    }

    // REVAMPED: Handles the view transition between 'chat' and 'coding' modes.
    const handleAiModeChange = (newMode: AiMode) => {
        const newView: AppView = newMode === 'code-assistant' ? 'coding' : 'chat';

        if (newView !== currentView) {
            if (newView === 'coding') {
                // If there's no active chat, create one before entering.
                if (!activeChatId) {
                    handleNewChat(false); // Create a new chat but don't switch view yet.
                }
                setIsTransitioning(true);
                setTimeout(() => {
                    setCurrentView('coding');
                    setAiMode('code-assistant');
                    setIsTransitioning(false);
                }, 3200); // Matches the 3.2s loading screen animation
            } else { // Exiting coding mode
                setIsExiting(true);
                // Pre-render the chat view behind the exit animation overlay
                setTimeout(() => {
                    setCurrentView('chat');
                    setAiMode('cognito');
                }, 500); // Switch view after 500ms, allowing overlay to be opaque
                
                // Unmount the exit animation overlay after it finishes
                setTimeout(() => {
                    setIsExiting(false);
                }, 2800); // Matches the 2.8s exit animation
            }
        } else {
             setAiMode(newMode);
        }
    };


    // REVAMPED: This function handles when the user sends a message.
    const handleSendMessage = async (content: string, context?: { code: string; output: string; lang: string }) => {
        let currentChatId = activeChatId;
        let history: Message[] = [];
        let isNewChat = false;
        
        // If there's no active chat, create a new one.
        if (!currentChatId) {
            isNewChat = true;
            const newChatId = Date.now().toString();
            const newChat: Chat = { id: newChatId, title: t('app.newChatTitle'), messages: [] };
            await saveChat(newChat); // Save the new chat to the DB.
            setChats(prev => [newChat, ...prev]);
            setActiveChatId(newChatId);
            currentChatId = newChatId;
        } else {
            // Get the history of the old chat.
            history = chats.find(c => c.id === currentChatId)?.messages || [];
        }

        // NEW: The user-facing message ONLY contains their direct input.
        const userMessage: Message = { id: Date.now().toString(), role: 'user', content: content };
        
        // The message for the API includes the hidden context.
        let messageForApi = content;
        if (currentView === 'coding' && context && (context.code || context.output.trim())) {
            const codeBlock = context.code ? `\n\n**My Code (${context.lang}):**\n\`\`\`${context.lang}\n${context.code}\n\`\`\`` : '';
            const outputBlock = context.output.trim() ? `\n\n**Console Output:**\n\`\`\`\n${context.output.trim()}\n\`\`\`` : '';
            messageForApi = `${content}${codeBlock}${outputBlock}`;
        }
        
        const modelMessageId = (Date.now() + 1).toString();
        // Add a placeholder message for the AI's response.
        const modelPlaceholder: Message = { id: modelMessageId, role: 'model', content: '' };
        
        // Immediately update the UI with the user message and AI placeholder.
        setChats(prev => prev.map(c => 
            c.id === currentChatId 
                ? { ...c, messages: [...c.messages, userMessage, modelPlaceholder] } 
                : c
        ));
        
        setIsAiLoading(true); // Loading state on.
        stopGenerationRef.current = false; // Reset the stop flag.
        
        let fullResponse = '';
        try {
            // Determine which AI mode to use for the API call.
            const modeForAPI = currentView === 'coding' ? 'code-assistant' : 'cognito';
            const chatSession = startChat(history, modeForAPI);
            const responseStream = await chatSession.sendMessageStream({ message: messageForApi });
            
            for await (const chunk of responseStream) {
                if (stopGenerationRef.current) break;
                
                if (chunk && chunk.text) {
                    fullResponse += chunk.text;
                    // Update the UI as each chunk arrives.
                    setChats(prev => prev.map(chat => {
                        if (chat.id === currentChatId) {
                            const newMessages = chat.messages.map(msg => 
                                msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
                            );
                            return { ...chat, messages: newMessages };
                        }
                        return chat;
                    }));
                }
            }


            // If it was a new chat and a response was received, generate a title for it.
            if (isNewChat && fullResponse.trim()) {
                const finalModelMessage: Message = { id: modelMessageId, role: 'model', content: fullResponse };
                const messagesForTitle: Message[] = [userMessage, finalModelMessage];

                // For a new coding session, give it a default "Coding Session" title.
                const titlePromise = currentView === 'coding' 
                    ? Promise.resolve(t('app.newCodingSessionTitle'))
                    : getTitleForChat(messagesForTitle);

                titlePromise
                    .then(newTitle => {
                        setChats(prev => prev.map(c => c.id === currentChatId ? { ...c, title: newTitle } : c));
                    })
                    .catch(error => {
                        console.error("Error generating title for new chat:", error);
                    });
            }
        } catch (error: any) {
             console.error("Error getting AI response:", error);
            // Show the error on the UI.
            setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: `**Error:** ${error.message}` || "**An error occurred.** Please check your connection or API key." }
                                : msg
                        )
                    };
                }
                return chat;
            }));
        } finally {
            setIsAiLoading(false); // Loading state off.
            stopGenerationRef.current = false;
        }
    };
    
    // Function to regenerate the last response.
    const handleRegenerateResponse = async () => {
        if (!activeChat || isAiLoading) return;
        const messages = [...activeChat.messages];
        // Find the last model message and the user message before it.
        const lastModelMessageIndex = messages.map(m => m.role).lastIndexOf('model');
        if (lastModelMessageIndex < 0) return;

        const lastUserMessageIndex = messages.slice(0, lastModelMessageIndex).map(m => m.role).lastIndexOf('user');
        if (lastUserMessageIndex < 0) return;

        const lastUserMessageContent = messages[lastUserMessageIndex].content;
        const history = messages.slice(0, lastUserMessageIndex);

        const modelMessageId = (Date.now() + 1).toString();
        const modelPlaceholder: Message = { id: modelMessageId, role: 'model', content: '' };
        
        // Remove the old model response from the UI and add a new placeholder.
        setChats(prev => prev.map(c => 
            c.id === activeChat.id 
                ? { ...c, messages: [...history, messages[lastUserMessageIndex], modelPlaceholder] } 
                : c
        ));
        
        setIsAiLoading(true);
        stopGenerationRef.current = false; // Reset the stop flag.
        let fullResponse = '';
        try {
            const modeForAPI = currentView === 'coding' ? 'code-assistant' : 'cognito';
            const chatSession = startChat(history, modeForAPI);
            const responseStream = await chatSession.sendMessageStream({ message: lastUserMessageContent });

            for await (const chunk of responseStream) {
                 if (stopGenerationRef.current) break;
                 if (chunk && chunk.text) {
                    fullResponse += chunk.text;
                    setChats(prev => prev.map(chat => {
                        if (chat.id === activeChat.id) {
                            const newMessages = chat.messages.map(msg => 
                                msg.id === modelMessageId ? { ...msg, content: fullResponse } : msg
                            );
                            return { ...chat, messages: newMessages };
                        }
                        return chat;
                    }));
                }
            }
        } catch (error: any) {
             console.error("Error regenerating AI response:", error);
             setChats(prev => prev.map(chat => {
                 if (chat.id === activeChat.id) {
                     return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: `**Error:** ${error.message}` || "**Failed to regenerate.** Please try again." }
                                : msg
                        )
                    };
                 }
                 return chat;
            }));
        } finally {
            setIsAiLoading(false);
            stopGenerationRef.current = false;
        }
    };

    // To start a new chat.
    const handleNewChat = (changeView = true) => {
        // BUG FIX: If in coding mode, create a new session but stay in coding mode.
        if (currentView === 'coding') {
            const newChatId = Date.now().toString();
            const newChat: Chat = { id: newChatId, title: t('app.newCodingSessionTitle'), messages: [] };
            saveChat(newChat).then(() => {
                setChats(prev => [newChat, ...prev]);
                setActiveChatId(newChatId);
                if (changeView) setIsSidebarOpen(false);
            });
        } else {
            setActiveChatId(null);
            if (changeView) setIsSidebarOpen(false);
        }
    };

    // To select a chat from the list.
    const handleSelectChat = (id: string) => {
        if (currentView === 'coding') {
            handleAiModeChange('cognito');
        }
        setActiveChatId(id);
        setIsSidebarOpen(false);
    };
    
    // To change the title of a chat.
    const handleRenameChat = (id: string, newTitle: string) => {
        setChats(prev => {
            const newChats = prev.map(c => (c.id === id ? { ...c, title: newTitle } : c));
            const chatToSave = newChats.find(c => c.id === id);
            if (chatToSave) {
                saveChat(chatToSave).catch(err => console.error("Failed to save renamed chat", err));
            }
            return newChats;
        });
    };

    // To delete a chat.
    const handleDeleteChat = async (id: string) => {
        try {
            await deleteChat(id);
            const chatToDeleteIndex = chats.findIndex(c => c.id === id);
            const remainingChats = chats.filter(c => c.id !== id);
            setChats(remainingChats);

            // If the active chat was deleted, set a new active chat.
            if (activeChatId === id) {
                if (remainingChats.length > 0) {
                    const newActiveIndex = Math.max(0, chatToDeleteIndex - 1);
                    setActiveChatId(remainingChats[newActiveIndex].id);
                } else {
                    setActiveChatId(null);
                }
            }
        } catch (error) {
            console.error("Failed to delete chat:", error);
        }
    };

    // Opens the confirmation modal to delete all chats.
    const handleDeleteAllChats = () => {
        if (chats.length > 0) {
            setIsConfirmDeleteAllOpen(true);
        }
    };

    // Deletes all chats after confirmation.
    const executeDeleteAllChats = async () => {
        try {
            await deleteAllChats();
            setChats([]);
            setActiveChatId(null);
            setIsSidebarOpen(false);
        } catch (error) {
            console.error("Failed to delete all chats:", error);
        } finally {
            setIsConfirmDeleteAllOpen(false);
        }
    };

    // To copy text to the clipboard.
    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    // To toggle text-to-speech.
    const handleToggleSpeak = (message: Message) => {
        if (speakingMessageId === message.id) {
            speechSynthesis.cancel(); // If it's already speaking, stop it.
            setSpeakingMessageId(null);
        } else {
            speechSynthesis.cancel(); // If another message is speaking, stop it.
            const utterance = new SpeechSynthesisUtterance(message.content);
            utterance.onend = () => setSpeakingMessageId(null);
            utterance.onerror = () => setSpeakingMessageId(null);
            speechSynthesis.speak(utterance);
            setSpeakingMessageId(message.id);
        }
    };

    // To export the active chat to a text file.
    const handleExportChat = () => {
        if (!activeChat) return;
        const fileContent = activeChat.messages
            .map(msg => `${msg.role === 'user' ? userName : 'Cognito'}: ${msg.content}`)
            .join('\n\n');
        
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${activeChat.title.replace(/ /g, '_')}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // To save the name in the profile modal.
    const handleSaveProfile = (newName: string) => {
        setUserName(newName);
        setIsProfileModalOpen(false);
    };
    
    const renderChatView = () => (
        <>
            <header className="flex-shrink-0 flex items-center justify-center p-4 border-b border-card-border glassmorphism relative">
                {/* Menu button for mobile */}
                <button onClick={() => setIsSidebarOpen(true)} className="p-1 rounded-md border border-transparent hover:border-card-border absolute left-4 top-1/2 -translate-y-1/2 md:hidden">
                    <MenuIcon className="h-6 w-6" />
                </button>
                <h1 className={`font-heading text-xl font-bold tracking-widest text-center truncate px-12 md:px-0 uppercase animate-neon-flicker`}>
                    {activeChat ? activeChat.title : t('app.defaultChatTitle')}
                </h1>
            </header>
            <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
                 {/* Faint logo in the background (watermark) */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none watermark">
                    <CognitoLogo className="h-96 w-96" />
                </div>
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {/* If no chat is active, show the welcome screen */}
                    {!activeChat ? (
                    <div className="flex h-full items-center justify-center">
                            <div className="relative text-center flex flex-col items-center gap-4" style={{ top: '-5rem' }}>
                                <CognitoLogo className="w-28 h-28" />
                                <div className="text-center">
                                    <h1 className="font-heading text-4xl font-bold text-gray-200">{t('welcome.greeting').replace('{{name}}', userName)}</h1>
                                    <p className="mt-1 text-lg text-gray-400">{t('welcome.prompt')}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Render all messages of the active chat
                        <div className="max-w-3xl mx-auto space-y-8">
                            {activeChat.messages.map((msg, index) => (
                                <div key={msg.id} style={{ animationDelay: `${index * 100}ms` }} className="fade-in-up">
                                    <MessageComponent 
                                        message={msg}
                                        isLastMessage={index === activeChat.messages.length - 1}
                                        isAiLoading={isAiLoading}
                                        onCopy={handleCopyText}
                                        onSpeak={handleToggleSpeak}
                                        onRegenerate={handleRegenerateResponse}
                                        onStopGeneration={handleStopGeneration}
                                        speakingMessageId={speakingMessageId}
                                        inputRect={inputRect}
                                    />
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
                <ChatInput 
                    onSendMessage={(message) => handleSendMessage(message)}
                    isLoading={isAiLoading} 
                    showSuggestions={!activeChat || activeChat.messages.length === 0}
                    aiMode={aiMode}
                    onAiModeChange={handleAiModeChange}
                    onRectChange={setInputRect}
                    t={t}
                />
            </div>
        </>
    );

    const renderCurrentView = () => {
        if (currentView === 'coding') {
             return (
                <CodingPlayground 
                    onToggleSidebar={() => setIsSidebarOpen(p => !p)} 
                    onExit={() => handleAiModeChange('cognito')}
                    chat={activeChat ?? null}
                    onSendMessage={handleSendMessage}
                    isLoading={isAiLoading}
                    onCopyCode={handleCopyText}
                    isExiting={isExiting}
                    t={t}
                />
            );
        }
        // Fallback to chat view
        return renderChatView();
    };

    // Show LoadingScreen while data is being loaded from the DB.
    if (isDbLoading) {
        return <LoadingScreen t={t} />;
    }

    // The main JSX structure of the component.
    return (
        <div className="bg-transparent h-screen grid md:grid-cols-[auto_1fr] text-card-foreground overflow-hidden">
            <BackgroundCanvas animationType={backgroundAnimation} />
            <Sidebar 
                chats={chats}
                activeChatId={activeChatId}
                onNewChat={handleNewChat}
                onSelectChat={handleSelectChat}
                onRenameChat={handleRenameChat}
                onDeleteChat={handleDeleteChat}
                onDeleteAllChats={handleDeleteAllChats}
                isSidebarOpen={isSidebarOpen}
                onExportChat={handleExportChat}
                userName={userName}
                onProfileClick={() => setIsProfileModalOpen(true)}
                onAboutClick={() => setIsAboutModalOpen(true)}
                backgroundAnimation={backgroundAnimation}
                onBackgroundAnimationChange={setBackgroundAnimation}
                t={t}
                locale={locale}
                onLocaleChange={setLocale}
            />
             {/* If the sidebar is open on mobile, overlay the background */}
             {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-10 md:hidden"></div>}
            
            <main className="flex flex-col relative overflow-hidden">
                {renderCurrentView()}
            </main>

            {/* OVERLAYS FOR TRANSITIONS */}
            {isTransitioning && <CoreLoadingScreen show={true} t={t} />}
            {isExiting && <CoreDisintegrationScreen show={true} t={t} />}

            {/* Rendering the modals */}
            <ProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                onSave={handleSaveProfile}
                currentName={userName}
                t={t}
            />
            <AboutModal 
                isOpen={isAboutModalOpen}
                onClose={() => setIsAboutModalOpen(false)}
                t={t}
            />
            <ConfirmationModal
                isOpen={isConfirmDeleteAllOpen}
                onClose={() => setIsConfirmDeleteAllOpen(false)}
                onConfirm={executeDeleteAllChats}
                title={t('modals.confirmPurgeTitle')}
                message={t('modals.confirmPurgeMessage')}
                confirmButtonText={t('modals.confirmPurgeButton')}
                t={t}
            />
        </div>
    );
};

export default App;