import React, { useState, useEffect, useRef, useMemo } from 'react';
import { startChat, getTitleForChat, generateSpeech } from './services/geminiService';
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
    sidebar: { title: "COGNITO", newSession: "New Cognitive Chat", searchLogs: "Search Chats", background: "Background", about: "About Cognito AI", exportLog: "Export Chat", purgeLogs: "Clear All Chats", profileName: "Operator", language: "Language" },
    chatInput: { placeholderCognito: "Message Cognito...", placeholderCode: "Ask a coding question...", shiftEnter: "Shift + Enter for a new line.", suggestions: ["Draft a blueprint for a cyberpunk megacity", "Write a log entry from a starship captain discovering a new planet", "Invent a piece of futuristic technology and describe it", "Explain the concept of a neural network like I'm a detective", "Design a database schema for a colony on Mars", "Optimize this Python code for quantum processors", "What is the future of human-AI collaboration?", "Discuss the ethics of sentient machines", "Write a poem about the loneliness of data"], modeCognito: "Cognito Interface", modeCognitoDesc: "Conversational AI for general queries.", modeCode: "Code Core", modeCodeDesc: "Specialized interface for code & algorithms.", selectMode: "SELECT INTERFACE" },
    welcome: {
      messages: [
        { greeting: "Cognito online. All circuits nominal.", prompt: "Ready for your query, Operator." },
        { greeting: "Connection established, {{name}}.", prompt: "What's our objective today?" },
        { greeting: "Syncing with the datasphere...", prompt: "I am ready to process your request." },
        { greeting: "Welcome to the Cognito interface.", prompt: "Your thoughts, my processing power. Let's begin." }
      ]
    },
    modals: { aboutTitle: "Cognito AI // System Info", aboutSubtitle: "Cognitive Assistant Protocol v2.1", aboutLine1: "{{link}} is a modern, responsive AI assistant crafted to provide intelligent answers and a premium user experience.", aboutLine1Link: "Cognito AI", aboutLine2: "This application was developed by {{link}}, a passionate frontend engineer with a knack for creating beautiful, functional user interfaces.", aboutLine2Link: "Saksham", aboutLine3: "It is fueled by {{link}}, curiosity in ML & DBMS, and his interests.", aboutLine3Link: "Saksham's knowledge", profileTitle: "Operator Identification", profileSubtitle: "Update your callsign.", profileLabel: "Callsign", profilePlaceholder: "Enter your callsign", confirmPurgeTitle: "Confirm Clearing All Chats?", confirmPurgeMessage: "This will permanently delete all conversations. This action is irreversible and data cannot be recovered.", confirmPurgeButton: "Clear All", save: "Save", cancel: "Abort", close: "Disconnect" },
    app: { newChatTitle: "New Cognitive Session", newCodingSessionTitle: "Code Core Session", defaultChatTitle: "COGNITO AI INTERFACE", newChatPrompt: "Your query is my command." },
    coding: { title: "CODE CORE INTERFACE", exit: "Disengage Core", run: "EXECUTE >", executing: "EXECUTING...", initializing: "INITIALIZING...", copyCode: "Copy Snippet", copied: "Snippet Copied", consoleHeader: "// CONSOLE_OUTPUT", assistantHeader: "// ASSISTANT_INTERFACE", awaitingExecution: "[Awaiting execution command...]", assistantPlaceholder: "Input query..." },
    loading: { bootLog: ["[INITIATING] COGNITO OS v2.1", "[LOADING]    PERSONALITY_MATRIX.DAT", "[CALIBRATING] HEURISTIC_PROCESSORS", "[ESTABLISHING] SECURE_CHANNEL_TO_USER", "[STATUS]     ALL SYSTEMS NOMINAL."], thinking: ["Engaging cognitive processors...", "Accessing neural network...", "Parsing data streams...", "Compiling response matrix...", "Reticulating splines...", "Querying the global datasphere..."] },
    errors: { api: ["Signal lost. An anomaly has occurred in the data stream. Please try re-routing your query.", "Cognitive dissonance detected. My processors were unable to resolve your request. Please rephrase.", "A data corruption has been detected in the pipeline. I've purged the faulty packets. Please send your query again.", "My connection to the core has been severed. Please check your network link and retry."] },
    coreLoading: { title: "INITIALIZING CODE CORE", bootLog: ["[SYS] BOOT SEQUENCE INITIATED...", "[MEM] VIRTUAL MEMORY ALLOCATED", "[CPU] PROCESSOR KERNELS ONLINE", "[NET] SECURE LINK ESTABLISHED", "[ENV] RUNTIME ENVIRONMENT CALIBRATED", "[UI] INTEGRATING GRAPHICAL SHELL...", "[OK] CORE INITIALIZATION COMPLETE."] },
    coreDisintegration: { title: "DISENGAGING CODING CORE", shutdownLog: ["[SYS] SHUTDOWN SEQUENCE INITIATED...", "[MEM] VIRTUAL MEMORY DEALLOCATED", "[CPU] RELEASING PROCESSOR KERNELS", "[NET] SECURE LINK TERMINATED", "[UI] DISENGAGING GRAPHICAL SHELL...", "[OK] CORE SHUTDOWN COMPLETE.", "[SYS] RETURNING TO COGNITO INTERFACE."] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  // NOTE: Other languages use English fallbacks for the new dynamic text for now.
  es: {
    sidebar: { title: "COGNITO", newSession: "Nuevo Chat Cognitivo", searchLogs: "Buscar Chats", background: "Fondo", about: "Acerca de Cognito AI", exportLog: "Exportar Chat", purgeLogs: "Borrar Todos los Chats", profileName: "Operador", language: "Idioma" },
    chatInput: { placeholderCognito: "Mensaje a Cognito...", placeholderCode: "Haz una pregunta de código...", shiftEnter: "Shift + Enter para nueva línea.", suggestions: ["Draft a blueprint for a cyberpunk megacity", "Write a log entry from a starship captain discovering a new planet", "Invent a piece of futuristic technology and describe it", "Explain the concept of a neural network like I'm a detective", "Design a database schema for a colony on Mars", "Optimize this Python code for quantum processors", "What is the future of human-AI collaboration?", "Discuss the ethics of sentient machines", "Write a poem about the loneliness of data"], modeCognito: "Interfaz Cognito", modeCognitoDesc: "IA conversacional para consultas generales.", modeCode: "Núcleo de Código", modeCodeDesc: "Interfaz especializada para código y algoritmos.", selectMode: "SELECCIONAR INTERFAZ" },
    welcome: {
      messages: [
        { greeting: "Cognito en línea. Todos los circuitos nominales.", prompt: "Listo para su consulta, Operador." },
        { greeting: "Conexión establecida, {{name}}.", prompt: "¿Cuál es nuestro objetivo hoy?" },
        { greeting: "Sincronizando con la datasfera...", prompt: "Estoy listo para procesar su solicitud." },
        { greeting: "Bienvenido a la interfaz de Cognito.", prompt: "Sus pensamientos, mi poder de procesamiento. Empecemos." }
      ]
    },
    modals: { aboutTitle: "Cognito AI // Información del Sistema", aboutSubtitle: "Protocolo de Asistente Cognitivo v2.1", aboutLine1: "{{link}} es un asistente de IA moderno y receptivo, diseñado para proporcionar respuestas inteligentes y una experiencia de usuario premium.", aboutLine1Link: "Cognito AI", aboutLine2: "Esta aplicación fue desarrollada por {{link}}, un apasionado ingeniero de frontend con un don para crear interfaces de usuario hermosas y funcionales.", aboutLine2Link: "Saksham", aboutLine3: "Está impulsado por {{link}}, su curiosidad en ML y SGBD, y sus intereses.", aboutLine3Link: "el conocimiento de Saksham", profileTitle: "Identificación de Operador", profileSubtitle: "Actualiza tu indicativo.", profileLabel: "Indicativo", profilePlaceholder: "Introduce tu indicativo", confirmPurgeTitle: "¿Confirmar Borrar Todos los Chats?", confirmPurgeMessage: "Esto borrará permanentemente todas las conversaciones. Esta acción es irreversible y los datos no se pueden recuperar.", confirmPurgeButton: "Borrar Todo", save: "Guardar", cancel: "Abortar", close: "Desconectar" },
    app: { newChatTitle: "Nueva Sesión Cognitiva", newCodingSessionTitle: "Sesión de Núcleo de Código", defaultChatTitle: "INTERFAZ COGNITO AI", newChatPrompt: "Su consulta es mi comando." },
    coding: { title: "INTERFAZ DEL NÚCLEO DE CÓDIGO", exit: "Desconectar Núcleo", run: "EJECUTAR >", executing: "EJECUTANDO...", initializing: "INICIALIZANDO...", copyCode: "Copiar Fragmento", copied: "Fragmento Copiado", consoleHeader: "// SALIDA_CONSOLA", assistantHeader: "// INTERFAZ_ASISTENTE", awaitingExecution: "[Esperando comando de ejecución...]", placeholder: "Introduce consulta..." },
    loading: { bootLog: ["[INICIANDO] COGNITO OS v2.1", "[CARGANDO]   MATRIZ_DE_PERSONALIDAD.DAT", "[CALIBRANDO] PROCESADORES_HEURÍSTICOS", "[ESTABLECIENDO] CANAL_SEGURO_AL_USUARIO", "[ESTADO]     TODOS LOS SISTEMAS NOMINALES."], thinking: ["Engaging cognitive processors...", "Accessing neural network...", "Parsing data streams...", "Compiling response matrix...", "Reticulating splines...", "Querying the global datasphere..."] },
    errors: { api: ["Signal lost. An anomaly has occurred in the data stream. Please try re-routing your query.", "Cognitive dissonance detected. My processors were unable to resolve your request. Please rephrase.", "A data corruption has been detected in the pipeline. I've purged the faulty packets. Please send your query again.", "My connection to the core has been severed. Please check your network link and retry."] },
    coreLoading: { title: "INICIALIZANDO NÚCLEO DE CÓDIGO", bootLog: ["[SIS] SECUENCIA DE ARRANQUE INICIADA...", "[MEM] MEMORIA VIRTUAL ASIGNADA", "[CPU] NÚCLEOS DE PROCESADOR EN LÍNEA", "[RED] ENLACE SEGURO ESTABLECIDO", "[ENT] ENTORNO DE EJECUCIÓN CALIBRADO", "[UI] INTEGRANDO SHELL GRÁFICO...", "[OK] INICIALIZACIÓN DEL NÚCLEO COMPLETA."] },
    coreDisintegration: { title: "DESCONECTANDO NÚCLEO DE CÓDIGO", shutdownLog: ["[SIS] SECUENCIA DE APAGADO INICIADA...", "[MEM] MEMORIA VIRTUAL DESASIGNADA", "[CPU] LIBERANDO NÚCLEOS DE PROCESADOR", "[RED] ENLACE SEGURO TERMINADO", "[UI] DESCONECTANDO SHELL GRÁFICO...", "[OK] APAGADO DEL NÚCLEO COMPLETO.", "[SIS] VOLVIENDO A LA INTERFAZ DE COGNITO."] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  hi: {
    sidebar: { title: "COGNITO", newSession: "नया कॉग्निटिव चैट", searchLogs: "चैट खोजें", background: "पृष्ठभूमि", about: "कॉग्निटो एआई के बारे में", exportLog: "चैट निर्यात करें", purgeLogs: "सभी चैट साफ़ करें", profileName: "ऑपरेटर", language: "भाषा" },
    chatInput: { placeholderCognito: "कॉग्निटो को संदेश भेजें...", placeholderCode: "कोडिंग प्रश्न पूछें...", shiftEnter: "नई लाइन के लिए Shift + Enter दबाएं।", suggestions: ["Draft a blueprint for a cyberpunk megacity", "Write a log entry from a starship captain discovering a new planet", "Invent a piece of futuristic technology and describe it", "Explain the concept of a neural network like I'm a detective", "Design a database schema for a colony on Mars", "Optimize this Python code for quantum processors", "What is the future of human-AI collaboration?", "Discuss the ethics of sentient machines", "Write a poem about the loneliness of data"], modeCognito: "कॉग्निटो इंटरफेस", modeCognitoDesc: "सामान्य प्रश्नों के लिए संवादी एआई।", modeCode: "कोड कोर", modeCodeDesc: "कोड और एल्गोरिदम के लिए विशेष इंटरफ़ेस।", selectMode: "इंटरफ़ेस चुनें" },
    welcome: {
      messages: [
        { greeting: "कॉग्निटो ऑनलाइन। सभी सर्किट सामान्य।", prompt: "आपकी क्वेरी के लिए तैयार, ऑपरेटर।" },
        { greeting: "कनेक्शन स्थापित हुआ, {{name}}।", prompt: "आज हमारा उद्देश्य क्या है?" },
        { greeting: "डेटास्फीयर के साथ सिंक हो रहा है...", prompt: "मैं आपके अनुरोध को संसाधित करने के लिए तैयार हूँ।" },
        { greeting: "कॉग्निटो इंटरफ़ेस में आपका स्वागत है।", prompt: "आपके विचार, मेरी प्रसंस्करण शक्ति। चलिए शुरू करते हैं।" }
      ]
    },
    modals: { aboutTitle: "कॉग्निटो एआई // सिस्टम जानकारी", aboutSubtitle: "कॉग्निटिव असिस्टेंट प्रोटोकॉल v2.1", aboutLine1: "{{link}} एक आधुनिक, उत्तरदायी एआई सहायक है जिसे बुद्धिमान उत्तर और एक प्रीमियम उपयोगकर्ता अनुभव प्रदान करने के लिए तैयार किया गया है।", aboutLine1Link: "कॉग्निटो एआई", aboutLine2: "यह एप्लिकेशन {{link}} द्वारा विकसित किया गया था, जो सुंदर, कार्यात्मक यूजर इंटरफेस बनाने की कला के साथ एक उत्साही फ्रंटएंड इंजीनियर है।", aboutLine2Link: "सक्षम", aboutLine3: "यह {{link}}, एमएल और डीबीएमएस में जिज्ञासा, और उनकी रुचियों से प्रेरित है।", aboutLine3Link: "सक्षम के ज्ञान", profileTitle: "ऑपरेटर पहचान", profileSubtitle: "अपना कॉलसाइन अपडेट करें।", profileLabel: "कॉलसाइन", profilePlaceholder: "अपना कॉलसाइन दर्ज करें", confirmPurgeTitle: "सभी चैट साफ़ करने की पुष्टि करें?", confirmPurgeMessage: "यह सभी वार्तालापों को स्थायी रूप से मिटा देगा। यह क्रिया अपरिवर्तनीय है और डेटा पुनर्प्राप्त नहीं किया जा सकता है।", confirmPurgeButton: "सब साफ़ करें", save: "सहेजें", cancel: "रद्द करें", close: "डिस्कनेक्ट करें" },
    app: { newChatTitle: "नया कॉग्निटिव सत्र", newCodingSessionTitle: "कोड कोर सत्र", defaultChatTitle: "कॉग्निटो एआई इंटरफ़ेस", newChatPrompt: "आपकी क्वेरी ही मेरा आदेश है।" },
    coding: { title: "कोड कोर इंटरफ़ेस", exit: "कोर से अलग हों", run: "निष्पादित करें >", executing: "निष्पादित हो रहा है...", initializing: "शुरू हो रहा है...", copyCode: "स्निपेट कॉपी करें", copied: "स्निपेट कॉपी किया गया", consoleHeader: "// कंसोल_आउटपुट", assistantHeader: "// सहायक_इंटरफ़ेस", awaitingExecution: "[निष्पादन कमांड की प्रतीक्षा में...]", placeholder: "प्रश्न दर्ज करें..." },
    loading: { bootLog: ["[प्रारंभ] कॉग्निटो ओएस v2.1", "[लोड हो रहा है] पर्सनैलिटी_मैट्रिक्स.डैट", "[कैलिब्रेटिंग] ह्यूरिस्टिक_प्रोसेसर", "[स्थापित] उपयोगकर्ता के लिए सुरक्षित चैनल", "[स्थिति] सभी सिस्टम सामान्य हैं।"], thinking: ["Engaging cognitive processors...", "Accessing neural network...", "Parsing data streams...", "Compiling response matrix...", "Reticulating splines...", "Querying the global datasphere..."] },
    errors: { api: ["Signal lost. An anomaly has occurred in the data stream. Please try re-routing your query.", "Cognitive dissonance detected. My processors were unable to resolve your request. Please rephrase.", "A data corruption has been detected in the pipeline. I've purged the faulty packets. Please send your query again.", "My connection to the core has been severed. Please check your network link and retry."] },
    coreLoading: { title: "कोडिंग कोर शुरू हो रहा है", bootLog: ["[सिस्टम] बूट अनुक्रम शुरू...", "[मेमोरी] वर्चुअल मेमोरी आवंटित", "[सीपीयू] प्रोसेसर कर्नेल ऑनलाइन", "[नेट] सुरक्षित लिंक स्थापित", "[ईएनवी] रनटाइम वातावरण कैलिब्रेटेड", "[यूआई] ग्राफिकल शेल को एकीकृत करना...", "[ठीक है] कोर आरंभीकरण पूर्ण।"] },
    coreDisintegration: { title: "कोडिंग कोर को निष्क्रिय करना", shutdownLog: ["[सिस्टम] शटडाउन अनुक्रम शुरू...", "[मेमोरी] वर्चुअल मेमोरी डीलोकेटेड", "[सीपीयू] प्रोसेसर कर्नेल जारी करना", "[नेट] सुरक्षित लिंक समाप्त", "[यूआई] ग्राफिकल शेल को निष्क्रिय करना...", "[ठीक है] कोर शटडाउन पूर्ण।", "[सिस्टम] कॉग्निटो इंटरफ़ेस पर लौटना।"] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  fr: {
    sidebar: { title: "COGNITO", newSession: "Nouveau Chat Cognitif", searchLogs: "Rechercher les Chats", background: "Arrière-plan", about: "À propos de Cognito AI", exportLog: "Exporter le Chat", purgeLogs: "Effacer Tous les Chats", profileName: "Opérateur", language: "Langue" },
    chatInput: { placeholderCognito: "Message à Cognito...", placeholderCode: "Posez une question de code...", shiftEnter: "Maj + Entrée pour une nouvelle ligne.", suggestions: ["Draft a blueprint for a cyberpunk megacity", "Write a log entry from a starship captain discovering a new planet", "Invent a piece of futuristic technology and describe it", "Explain the concept of a neural network like I'm a detective", "Design a database schema for a colony on Mars", "Optimize this Python code for quantum processors", "What is the future of human-AI collaboration?", "Discuss the ethics of sentient machines", "Write a poem about the loneliness of data"], modeCognito: "Interface Cognito", modeCognitoDesc: "IA conversationnelle pour requêtes générales.", modeCode: "Noyau de Code", modeCodeDesc: "Interface spécialisée pour code et algorithmes.", selectMode: "SÉLECTIONNER L'INTERFACE" },
    welcome: {
      messages: [
        { greeting: "Cognito en ligne. Tous les circuits nominaux.", prompt: "Prêt pour votre requête, Opérateur." },
        { greeting: "Connexion établie, {{name}}.", prompt: "Quel est notre objectif aujourd'hui ?" },
        { greeting: "Synchronisation avec la datasphère...", prompt: "Je suis prêt à traiter votre demande." },
        { greeting: "Bienvenue sur l'interface Cognito.", prompt: "Vos pensées, ma puissance de traitement. Commençons." }
      ]
    },
    modals: { aboutTitle: "Cognito AI // Infos Système", aboutSubtitle: "Protocole d'Assistant Cognitif v2.1", aboutLine1: "{{link}} est un assistant IA moderne et réactif, conçu pour fournir des réponses intelligentes et une expérience utilisateur de premier ordre.", aboutLine1Link: "Cognito AI", aboutLine2: "Cette application a été développée par {{link}}, un ingénieur frontend passionné avec un talent pour créer des interfaces utilisateur belles et fonctionnelles.", aboutLine2Link: "Saksham", aboutLine3: "Elle est alimentée par {{link}}, sa curiosité pour le ML & SGBD, et ses intérêts.", aboutLine3Link: "les connaissances de Saksham", profileTitle: "Identification de l'Opérateur", profileSubtitle: "Mettez à jour votre indicatif.", profileLabel: "Indicatif", profilePlaceholder: "Entrez votre indicatif", confirmPurgeTitle: "Confirmer la Suppression de Tous les Chats ?", confirmPurgeMessage: "Ceci effacera définitivement toutes les conversations. Cette action est irréversible et les données ne peuvent être récupérées.", confirmPurgeButton: "Tout Effacer", save: "Enregistrer", cancel: "Abandonner", close: "Déconnecter" },
    app: { newChatTitle: "Nouvelle Session Cognitive", newCodingSessionTitle: "Session Noyau de Code", defaultChatTitle: "INTERFACE COGNITO AI", newChatPrompt: "Votre requête est mon ordre." },
    coding: { title: "INTERFACE DU NOYAU DE CODAGE", exit: "Désengager le Noyau", run: "EXÉCUTER >", executing: "EXÉCUTION...", initializing: "INITIALISATION...", copyCode: "Copier l'Extrait", copied: "Extrait Copié", consoleHeader: "// SORTIE_CONSOLE", assistantHeader: "// INTERFACE_ASSISTANT", awaitingExecution: "[En attente de commande d'exécution...]", placeholder: "Entrez la requête..." },
    loading: { bootLog: ["[INITIALISATION] COGNITO OS v2.1", "[CHARGEMENT]   MATRICE_PERSONNALITÉ.DAT", "[CALIBRAGE]    PROCESSEURS_HEURISTIQUES", "[ÉTABLISSEMENT] CANAL_SÉCURISÉ_VERS_UTILISATEUR", "[STATUT]       TOUS_SYSTÈMES_NOMINAUX."], thinking: ["Engaging cognitive processors...", "Accessing neural network...", "Parsing data streams...", "Compiling response matrix...", "Reticulating splines...", "Querying the global datasphere..."] },
    errors: { api: ["Signal lost. An anomaly has occurred in the data stream. Please try re-routing your query.", "Cognitive dissonance detected. My processors were unable to resolve your request. Please rephrase.", "A data corruption has been detected in the pipeline. I've purged the faulty packets. Please send your query again.", "My connection to the core has been severed. Please check your network link and retry."] },
    coreLoading: { title: "INITIALISATION DU NOYAU DE CODAGE", bootLog: ["[SYS] SÉQUENCE DE DÉMARRAGE INITIÉE...", "[MEM] MÉMOIRE VIRTUELLE ALLOUÉE", "[CPU] COEURS DE PROCESSEUR EN LIGNE", "[NET] LIAISON SÉCURISÉE ÉTABLIE", "[ENV] ENVIRONNEMENT D'EXÉCUTION CALIBRÉ", "[UI] INTÉGRATION DE L'INTERFACE GRAPHIQUE...", "[OK] INITIALISATION DU NOYAU TERMINÉE."] },
    coreDisintegration: { title: "DÉSENGAGEMENT DU NOYAU DE CODAGE", shutdownLog: ["[SYS] SÉQUENCE D'ARRÊT INITIÉE...", "[MEM] MÉMOIRE VIRTUELLE DÉSALLOUÉE", "[CPU] LIBÉRATION DES COEURS DE PROCESSEUR", "[NET] LIAISON SÉCURISÉE TERMINÉE", "[UI] DÉSENGAGEMENT DE L'INTERFACE GRAPHIQUE...", "[OK] ARRÊT DU NOYAU TERMINÉ.", "[SYS] RETOUR À L'INTERFACE COGNITO."] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  sa: {
    sidebar: { title: "COGNITO", newSession: "नवीनः संज्ञानात्मकः चैटः", searchLogs: "चैटान्वेषणम्...", background: "पृष्ठभूमिः", about: "कोग्निटो एआई विषये", exportLog: "चैटं निर्यातं कुरु", purgeLogs: "सर्वान् चैटान् निष्कासय", profileName: "प्रचालकः", language: "भाषा" },
    chatInput: { placeholderCognito: "कोग्निटो कृते सन्देशः...", placeholderCode: "कूटलेखनप्रश्नं पृच्छतु...", shiftEnter: "नवीनपङ्क्तये Shift + Enter", suggestions: ["Draft a blueprint for a cyberpunk megacity", "Write a log entry from a starship captain discovering a new planet", "Invent a piece of futuristic technology and describe it", "Explain the concept of a neural network like I'm a detective", "Design a database schema for a colony on Mars", "Optimize this Python code for quantum processors", "What is the future of human-AI collaboration?", "Discuss the ethics of sentient machines", "Write a poem about the loneliness of data"], modeCognito: "कोग्निटो-अन्तरापृष्ठम्", modeCognitoDesc: "सामान्यप्रश्नेभ्यः संवादी एआई।", modeCode: "कूट-केन्द्रम्", modeCodeDesc: "कूट-अल्गोरिदम-कृते विशिष्टम् अन्तरापृष्ठम्।", selectMode: "अन्तरापृष्ठं चिनोतु" },
    welcome: {
      messages: [
        { greeting: "कोग्निटो ऑनलाइन। सर्वे सर्किटाः सामान्याः।", prompt: "भवतः प्रश्नार्थं सज्जः, प्रचालकः।" },
        { greeting: "सम्पर्कः स्थापितः, {{name}}।", prompt: "अद्य अस्माकं किं लक्ष्यम्?" },
        { greeting: "डेटास्फेरेण सह समकालीकरणम्...", prompt: "अहं भवतः अनुरोधं संसाधयितुं सज्जः अस्मि।" },
        { greeting: "कोग्निटो-अन्तरापृष्ठे स्वागतम्।", prompt: "भवतः विचाराः, मम प्रसंस्करणशक्तिः। आरभामहे।" }
      ]
    },
    modals: { aboutTitle: "कोग्निटो एआई // तन्त्रसूचना", aboutSubtitle: "संज्ञानात्मक-सहायक-प्रोटोकॉल् v2.1", aboutLine1: "{{link}} एकः आधुनिकः, प्रतिक्रियाशीलः एआई सहायकः अस्ति यः बुद्धिमत्-उत्तराणि, उत्तम-उपयोक्तृ-अनुभवं च प्रदातुं निर्मितः।", aboutLine1Link: "कोग्निटो एआई", aboutLine2: "इदं अनुप्रयोगं {{link}}-द्वारा विकसितम्, यः सुन्दर-क्रियाशील-उपयोक्तृ-अन्तरापृष्ठानि निर्मातुं कुशलः उत्साही फ्रन्टएण्ड-अभियन्ता अस्ति।", aboutLine2Link: "सक्षम", aboutLine3: "इदं {{link}}, एमएल-डीबीएमएस-मध्ये तस्य जिज्ञासया, तस्य रुचिभिश्च चालितम्।", aboutLine3Link: "सक्षमस्य ज्ञानेन", profileTitle: "प्रचालक-परिचयः", profileSubtitle: "भवतः आह्वानचिह्नं नूतनीकरोतु।", profileLabel: "आह्वानचिह्नम्", profilePlaceholder: "आह्वानचिह्नं लिखतु", confirmPurgeTitle: "सर्वान् चैटान् निष्कासयितुं निश्चिनोतु वा?", confirmPurgeMessage: "एतेन सर्वे वार्तालापाः स्थायिरूपेण मार्जयिष्यन्ते। एतत् कार्यम् अपरिवर्तनीयम् अस्ति, दत्तांशः च पुनः प्राप्तुं न शक्यते।", confirmPurgeButton: "सर्वं निष्कासय", save: "रक्षतु", cancel: "त्यजतु", close: "वियोजयतु" },
    app: { newChatTitle: "नवीनं संज्ञानात्मकं सत्रम्", newCodingSessionTitle: "कूट-केन्द्र-सत्रम्", defaultChatTitle: "कोग्निटो एआई अन्तरापृष्ठम्", newChatPrompt: "भवतः प्रश्नः मम आदेशः।" },
    coding: { title: "कूट-केन्द्र-अन्तरापृष्ठम्", exit: "केन्द्रं त्यजतु", run: "निष्पादयतु >", executing: "निष्पाद्यमानम्...", initializing: "आरभ्यमाणम्...", copyCode: "खण्डं प्रतिलिपिं करोतु", copied: "खण्डं प्रतिलिपिः कृतः", consoleHeader: "// कन्सोल-आउट्पुट्", assistantHeader: "// सहायक-अन्तरापृष्ठम्", awaitingExecution: "[निष्पादन-आदेशं प्रतीक्षमाणम्...]", placeholder: "प्रश्नं लिखतु..." },
    loading: { bootLog: ["[प्रारम्भः] कोग्निटो ओएस v2.1", "[भारणम्]   व्यक्तित्व-मैट्रिक्स.डैट", "[समंजनम्]   अनुमानात्मक-प्रसंसाधकाः", "[स्थापनम्]   उपयोक्त्रे सुरक्षित-चैनलम्", "[स्थितिः]     सर्वाणि तन्त्राणि सामान्यनि।"], thinking: ["Engaging cognitive processors...", "Accessing neural network...", "Parsing data streams...", "Compiling response matrix...", "Reticulating splines...", "Querying the global datasphere..."] },
    errors: { api: ["Signal lost. An anomaly has occurred in the data stream. Please try re-routing your query.", "Cognitive dissonance detected. My processors were unable to resolve your request. Please rephrase.", "A data corruption has been detected in the pipeline. I've purged the faulty packets. Please send your query again.", "My connection to the core has been severed. Please check your network link and retry."] },
    coreLoading: { title: "कूटलेखन-केन्द्रम् आरभ्यते", bootLog: ["[तन्त्रम्] बूट्-अनुक्रमः आरब्धः...", "[स्मृतिः] आभासी स्मृतिः वितरिता", "[सीपीयू] प्रोसेसर-केन्द्रकाणि ऑनलाइन्", "[जालम्] सुरक्षित-सम्पर्कः स्थापितः", "[पर्यावरणम्] रनटाइम-पर्यावरणं समंजितम्", "[यूआई] ग्राफिकल-शेल् एकीकृतम्...", "[ओके] केन्द्र-आरम्भः पूर्णः।"] },
    coreDisintegration: { title: "कूटलेखन-केन्द्रं वियोज्यते", shutdownLog: ["[तन्त्रम्] शटडाउन-अनुक्रमः आरब्धः...", "[स्मृतिः] आभासी स्मृतिः अविभाजिता", "[सीपीयू] प्रोसेसर-केन्द्रकाणि मुक्तानि", "[जालम्] सुरक्षित-सम्पर्कः समाप्तः", "[यूआई] ग्राफिकल-शेल् वियोजितम्...", "[ओके] केन्द्र-शटडाउन पूर्णम्।", "[तन्त्रम्] कोग्निटो-अन्तरापृष्ठं प्रति गमनम्।"] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  },
  'hi-en': {
    sidebar: { title: "COGNITO", newSession: "New Cognitive Chat", searchLogs: "Chats search karo", background: "Background", about: "Cognito AI ke baare mein", exportLog: "Chat Export karo", purgeLogs: "Sab Chats Clear karo", profileName: "Operator", language: "Language" },
    chatInput: { placeholderCognito: "Cognito ko message bhejo...", placeholderCode: "Coding ka sawaal pucho...", shiftEnter: "Nayi line ke liye Shift + Enter.", suggestions: ["Draft a blueprint for a cyberpunk megacity", "Write a log entry from a starship captain discovering a new planet", "Invent a piece of futuristic technology and describe it", "Explain the concept of a neural network like I'm a detective", "Design a database schema for a colony on Mars", "Optimize this Python code for quantum processors", "What is the future of human-AI collaboration?", "Discuss the ethics of sentient machines", "Write a poem about the loneliness of data"], modeCognito: "Cognito Interface", modeCognitoDesc: "General sawaalon ke liye conversational AI.", modeCode: "Code Core", modeCodeDesc: "Code aur algorithms ke liye special interface.", selectMode: "INTERFACE SELECT KARO" },
    welcome: {
      messages: [
        { greeting: "Cognito online. Sab circuits nominal.", prompt: "Aapke query ke liye taiyaar, Operator." },
        { greeting: "Connection jud gaya, {{name}}.", prompt: "Aaj ka objective kya hai?" },
        { greeting: "Datasphere se sync ho raha hai...", prompt: "Main aapka request process karne ke liye taiyaar hoon." },
        { greeting: "Cognito interface mein swagat hai.", prompt: "Aapke vichaar, meri processing power. Chalo shuru karein." }
      ]
    },
    modals: { aboutTitle: "Cognito AI // System Info", aboutSubtitle: "Cognitive Assistant Protocol v2.1", aboutLine1: "{{link}} ek modern, responsive AI assistant hai jo intelligent answers aur premium user experience ke liye banaya gaya hai.", aboutLine1Link: "Cognito AI", aboutLine2: "Yeh application {{link}} ne develop ki hai, jo ek passionate frontend engineer hain aur sundar, functional user interfaces banane mein mahir hain.", aboutLine2Link: "Saksham", aboutLine3: "Yeh {{link}}, ML & DBMS mein unki curiosity, aur unke interests se chalti hai.", aboutLine3Link: "Saksham ke knowledge", profileTitle: "Operator Identification", profileSubtitle: "Apna callsign update karo.", profileLabel: "Callsign", profilePlaceholder: "Apna callsign daalo", confirmPurgeTitle: "Sab Chats Clear karna Confirm karein?", confirmPurgeMessage: "Isse saare conversations permanently delete ho jayenge. Yeh action irreversible hai aur data recover nahi ho sakta.", confirmPurgeButton: "Sab Clear Karo", save: "Save Karo", cancel: "Abort", close: "Disconnect" },
    app: { newChatTitle: "New Cognitive Session", newCodingSessionTitle: "Code Core Session", defaultChatTitle: "COGNITO AI INTERFACE", newChatPrompt: "Aapki query hi mera command hai." },
    coding: { title: "CODE CORE INTERFACE", exit: "Core Disengage Karo", run: "EXECUTE >", executing: "EXECUTING...", initializing: "INITIALIZING...", copyCode: "Snippet Copy Karo", copied: "Snippet Copied", consoleHeader: "// CONSOLE_OUTPUT", assistantHeader: "// ASSISTANT_INTERFACE", awaitingExecution: "[Execution command ka intezaar...]", assistantPlaceholder: "Query input karo..." },
    loading: { bootLog: ["[INITIATING] COGNITO OS v2.1", "[LOADING]    PERSONALITY_MATRIX.DAT", "[CALIBRATING] HEURISTIC_PROCESSORS", "[ESTABLISHING] SECURE_CHANNEL_TO_USER", "[STATUS]     ALL SYSTEMS NOMINAL."], thinking: ["Engaging cognitive processors...", "Accessing neural network...", "Parsing data streams...", "Compiling response matrix...", "Reticulating splines...", "Querying the global datasphere..."] },
    errors: { api: ["Signal lost. An anomaly has occurred in the data stream. Please try re-routing your query.", "Cognitive dissonance detected. My processors were unable to resolve your request. Please rephrase.", "A data corruption has been detected in the pipeline. I've purged the faulty packets. Please send your query again.", "My connection to the core has been severed. Please check your network link and retry."] },
    coreLoading: { title: "INITIALIZING CODE CORE", bootLog: ["[SYS] BOOT SEQUENCE INITIATED...", "[MEM] VIRTUAL MEMORY ALLOCATED", "[CPU] PROCESSOR KERNELS ONLINE", "[NET] SECURE LINK ESTABLISHED", "[ENV] RUNTIME ENVIRONMENT CALIBRATED", "[UI] INTEGRATING GRAPHICAL SHELL...", "[OK] CORE INITIALIZATION COMPLETE."] },
    coreDisintegration: { title: "DISENGAGING CODING CORE", shutdownLog: ["[SYS] SHUTDOWN SEQUENCE INITIATED...", "[MEM] VIRTUAL MEMORY DEALLOCATED", "[CPU] RELEASING PROCESSOR KERNELS", "[NET] SECURE LINK TERMINATED", "[UI] DISENGAGING GRAPHICAL SHELL...", "[OK] CORE SHUTDOWN COMPLETE.", "[SYS] RETURNING TO COGNITO INTERFACE."] },
    languages: { en: "English", es: "Español", hi: "हिन्दी", fr: "Français", sa: "संस्कृतम्", 'hi-en': "Hinglish" }
  }
};

// --- NEW: Audio decoding helper functions for Gemini TTS ---
// Decodes a base64 string into a byte array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Decodes raw PCM audio data into an AudioBuffer for playback.
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The raw data is 16-bit PCM, so we create a Int16Array view on the buffer.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit integer samples to the [-1.0, 1.0] range for the Web Audio API.
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


const App: React.FC = () => {
    // Defining state variables using the useState hook.
    const [isAiLoading, setIsAiLoading] = useState(false); // Is the AI generating a response?
    const [chats, setChats] = useState<Chat[]>([]); // Array of all chats.
    const [activeChatId, setActiveChatId] = useState<string | null>(null); // The ID of the currently open chat.
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Is the sidebar open on mobile?
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null); // Which message is being spoken by text-to-speech.
    const [isAudioPaused, setIsAudioPaused] = useState(false); // Is the current audio paused?
    const [ttsLoadingMessageId, setTtsLoadingMessageId] = useState<string | null>(null); // Which message's audio is being fetched.
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
    const audioContextRef = useRef<AudioContext | null>(null); // Ref for the Web Audio API context.
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null); // Ref for the current audio source.
    const ttsGenerationInProgress = useRef(new Set<string>()); // NEW: Tracks in-flight TTS generation requests.
    chatsRef.current = chats;

    // Finding the active chat from the chats array.
    const activeChat = chats.find(c => c.id === activeChatId);
    
    // REVAMPED: More robust translation function to prevent startup crashes.
    const t = (key: string, fallback?: any): any => {
        const keys = key.split('.');
        let result: any = translations[locale];

        // Fallback to English if the selected locale doesn't exist in our translations object.
        if (!result) {
            result = translations['en'];
        }

        for (const k of keys) {
            // Check if the current result is an object and the key exists.
            if (result && typeof result === 'object' && k in result) {
                result = result[k];
            } else {
                // If the path is invalid, return the provided fallback value, or the key itself.
                return fallback !== undefined ? fallback : key;
            }
        }
        
        return result !== undefined ? result : (fallback !== undefined ? fallback : key);
    };

    // --- NEW: Randomized text selections, memoized to prevent re-calculating on every render ---
    const { welcomeMessage, chatSuggestions } = useMemo(() => {
        const welcomeMessages = t('welcome.messages', []);
        const selectedWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
        
        const allSuggestions = t('chatInput.suggestions', []);
        const selectedSuggestions = allSuggestions.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        return { welcomeMessage: selectedWelcome, chatSuggestions: selectedSuggestions };
    }, [locale]); // Recalculate if the language changes.


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
    
    // Helper to stop any ongoing audio playback.
    const stopAudioPlayback = () => {
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                /* Ignore errors, e.g., if already stopped */
            }
            audioSourceRef.current = null;
        }
         // If context was paused, it must be resumed so the next playback can start.
        if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
        setSpeakingMessageId(null);
        setIsAudioPaused(false); // Reset pause state.
    };

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
            // Fix: Pass an object with the 'message' property to sendMessageStream.
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
            const errorMessages = t('errors.api', []);
            const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            const displayError = `**Cognito Error:**\n${randomError}`;

            // Show the error on the UI.
            setChats(prev => prev.map(chat => {
                if (chat.id === currentChatId) {
                    return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: displayError }
                                : msg
                        )
                    };
                }
                return chat;
            }));
        } finally {
            setIsAiLoading(false);
            stopGenerationRef.current = false;
            // Proactively generate and cache TTS audio for the new message.
            if (fullResponse.trim() && !ttsGenerationInProgress.current.has(modelMessageId)) {
                ttsGenerationInProgress.current.add(modelMessageId);
                setTtsLoadingMessageId(modelMessageId);
                generateSpeech(fullResponse).then(audioData => {
                    if (audioData) {
                        setChats(prev => prev.map(c => 
                            c.id === currentChatId 
                                ? { ...c, messages: c.messages.map(m => m.id === modelMessageId ? { ...m, audioContent: audioData } : m) } 
                                : c
                        ));
                    }
                }).catch(err => {
                    console.error("Proactive TTS generation failed:", err);
                }).finally(() => {
                    ttsGenerationInProgress.current.delete(modelMessageId);
                    setTtsLoadingMessageId(prevId => (prevId === modelMessageId ? null : prevId));
                });
            }
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
            // Fix: Pass an object with the 'message' property to sendMessageStream.
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
             const errorMessages = t('errors.api', []);
             const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
             const displayError = `**Cognito Error:**\n${randomError}`;
             setChats(prev => prev.map(chat => {
                 if (chat.id === activeChat.id) {
                     return {
                        ...chat,
                        messages: chat.messages.map(msg =>
                            msg.id === modelMessageId
                                ? { ...msg, content: displayError }
                                : msg
                        )
                    };
                 }
                 return chat;
            }));
        } finally {
            setIsAiLoading(false);
            stopGenerationRef.current = false;
             // Proactively generate and cache TTS audio for the regenerated message.
            if (fullResponse.trim() && !ttsGenerationInProgress.current.has(modelMessageId)) {
                ttsGenerationInProgress.current.add(modelMessageId);
                setTtsLoadingMessageId(modelMessageId);
                generateSpeech(fullResponse).then(audioData => {
                    if (audioData) {
                        setChats(prev => prev.map(c => 
                            c.id === activeChat.id 
                                ? { ...c, messages: c.messages.map(m => m.id === modelMessageId ? { ...m, audioContent: audioData } : m) } 
                                : c
                        ));
                    }
                }).catch(err => console.error("Proactive TTS generation failed:", err)).finally(() => {
                    ttsGenerationInProgress.current.delete(modelMessageId);
                    setTtsLoadingMessageId(prevId => (prevId === modelMessageId ? null : prevId));
                });
            }
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
        // Stop audio if it's playing from the chat being deleted.
        const chatToDelete = chatsRef.current.find(c => c.id === id);
        if (chatToDelete) {
            const isSpeakingFromThisChat = chatToDelete.messages.some(m => m.id === speakingMessageId);
            if (isSpeakingFromThisChat) {
                stopAudioPlayback();
            }
        }

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

    // REVAMPED: Text-to-speech with pause and resume functionality.
    const handleToggleSpeak = async (message: Message) => {
        const isThisMessageActive = speakingMessageId === message.id;

        // Case 1: User is toggling pause/resume on the currently active message.
        if (isThisMessageActive && audioContextRef.current) {
            if (audioContextRef.current.state === 'running') {
                await audioContextRef.current.suspend();
                setIsAudioPaused(true);
            } else if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
                setIsAudioPaused(false);
            }
            return; // We're done.
        }

        // Case 2: User is starting a new message. Stop any existing audio first.
        if (speakingMessageId) {
            stopAudioPlayback();
        }
        
        // Prevent starting a new generation if one is already in progress for this message.
        if (ttsGenerationInProgress.current.has(message.id)) {
            return;
        }

        // A helper function to actually play the audio from base64 data.
        const playAudio = async (audioData: string) => {
            if (!audioContextRef.current) {
                const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
                audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            }
            const audioContext = audioContextRef.current;
            
            // This is a safety check. It should have been handled by stopAudioPlayback, but let's be sure.
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            const audioBytes = decode(audioData);
            const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
            
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            
            source.onended = () => {
                // Only clear state if this message was the one that ended.
                if (audioSourceRef.current === source) {
                    setSpeakingMessageId(null);
                    setIsAudioPaused(false);
                    audioSourceRef.current = null;
                }
            };
            
            audioSourceRef.current = source;
            source.start(); // Start from beginning.
            setSpeakingMessageId(message.id);
            setIsAudioPaused(false);
        };

        // Case 3: Get the audio data (either from cache or by generating it).
        if (message.audioContent) {
            try {
                await playAudio(message.audioContent);
            } catch (error) {
                console.error("Error playing pre-fetched audio:", error);
                alert("Sorry, there was an error playing the audio.");
                setSpeakingMessageId(null); // Clear state on error
                setIsAudioPaused(false);
            }
        } else {
            // Fallback: generate audio on-demand.
            try {
                ttsGenerationInProgress.current.add(message.id);
                setTtsLoadingMessageId(message.id);
                const audioData = await generateSpeech(message.content);
                
                if (!audioData) throw new Error("No audio data was returned from the API.");
                
                // Cache the newly generated audio.
                setChats(prev => prev.map(c => 
                    c.id === activeChatId 
                        ? { ...c, messages: c.messages.map(m => m.id === message.id ? { ...m, audioContent: audioData } : m) }
                        : c
                ));
                
                await playAudio(audioData);

            } catch (error) {
                console.error("Error in on-demand TTS process:", error);
                alert("Sorry, there was an error generating the audio for this message.");
                setSpeakingMessageId(null);
                setIsAudioPaused(false);
            } finally {
                ttsGenerationInProgress.current.delete(message.id);
                // Only clear loading state if it's for the current message.
                setTtsLoadingMessageId(prevId => (prevId === message.id ? null : prevId));
            }
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
                    {/* If no chat is active, or chat is empty, show the welcome screen */}
                    {!activeChat || activeChat.messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                            <div className="relative text-center flex flex-col items-center gap-4" style={{ top: '-5rem' }}>
                                <CognitoLogo className="w-28 h-28" />
                                <div className="text-center">
                                    <h1 className="font-heading text-4xl font-bold text-gray-200">
                                        {!activeChat ? welcomeMessage.greeting.replace('{{name}}', userName) : t('app.newChatTitle')}
                                    </h1>
                                    <p className="mt-1 text-lg text-gray-400">
                                        {!activeChat ? welcomeMessage.prompt : t('app.newChatPrompt')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Render all messages of the active chat
                        <div className="max-w-5xl mx-auto space-y-8">
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
                                        isAudioPaused={isAudioPaused}
                                        ttsLoadingMessageId={ttsLoadingMessageId}
                                        inputRect={inputRect}
                                        t={t}
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
                    showSuggestions={!activeChat}
                    suggestions={chatSuggestions}
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