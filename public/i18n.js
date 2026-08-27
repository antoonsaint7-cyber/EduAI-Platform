(() => {
  const translations = {
    ar: { dir:'rtl', name:'العربية', code:'ar', title:'مدرسك الذكي', subtitle:'مساعد تعليمي ذكي للطالب والمدرس.', mode:'الوضع', student:'👨‍🎓 طالب', teacher:'👨‍🏫 مدرس', subject:'المادة', level:'المستوى', beginner:'مبتدئ', intermediate:'متوسط', advanced:'متقدم', explain:'📚 اشرح الدرس', quiz:'📝 اعمل اختبار', review:'🔄 راجع أخطائي', plan:'📅 خطة مذاكرة', placeholder:'اكتب الدرس أو السؤال هنا...', send:'إرسال', talk:'🎙️ تحدث', clear:'مسح' },
    en: { dir:'ltr', name:'English', code:'en', title:'Your AI Tutor', subtitle:'An intelligent learning assistant for students and teachers.', mode:'Mode', student:'👨‍🎓 Student', teacher:'👨‍🏫 Teacher', subject:'Subject', level:'Level', beginner:'Beginner', intermediate:'Intermediate', advanced:'Advanced', explain:'📚 Explain lesson', quiz:'📝 Create quiz', review:'🔄 Review my mistakes', plan:'📅 Study plan', placeholder:'Write your lesson or question here...', send:'Send', talk:'🎙️ Speak', clear:'Clear' },
    fr: { dir:'ltr', name:'Français', code:'fr', title:'Votre tuteur IA', subtitle:'Un assistant pédagogique intelligent pour les élèves et les enseignants.', mode:'Mode', student:'👨‍🎓 Élève', teacher:'👨‍🏫 Enseignant', subject:'Matière', level:'Niveau', beginner:'Débutant', intermediate:'Intermédiaire', advanced:'Avancé', explain:'📚 Expliquer la leçon', quiz:'📝 Créer un quiz', review:'🔄 Réviser mes erreurs', plan:'📅 Plan d’étude', placeholder:'Écrivez votre leçon ou votre question ici...', send:'Envoyer', talk:'🎙️ Parler', clear:'Effacer' },
    es: { dir:'ltr', name:'Español', code:'es', title:'Tu tutor de IA', subtitle:'Un asistente educativo inteligente para estudiantes y profesores.', mode:'Modo', student:'👨‍🎓 Estudiante', teacher:'👨‍🏫 Profesor', subject:'Asignatura', level:'Nivel', beginner:'Principiante', intermediate:'Intermedio', advanced:'Avanzado', explain:'📚 Explicar la lección', quiz:'📝 Crear cuestionario', review:'🔄 Revisar mis errores', plan:'📅 Plan de estudio', placeholder:'Escribe aquí tu lección o pregunta...', send:'Enviar', talk:'🎙️ Hablar', clear:'Limpiar' }
  };
  window.EduAI18n = {
    translations,
    current() { return localStorage.getItem('eduai-language') || 'ar'; },
    set(lang) {
      const t = translations[lang] || translations.ar;
      localStorage.setItem('eduai-language', t.code);
      document.documentElement.lang = t.code;
      document.documentElement.dir = t.dir;
      document.querySelectorAll('[data-i18n]').forEach(el => { const key = el.dataset.i18n; if (t[key] !== undefined) el.textContent = t[key]; });
      document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { const key = el.dataset.i18nPlaceholder; if (t[key] !== undefined) el.placeholder = t[key]; });
      const subject = document.querySelector('#subject');
      if (subject) subject.dir = t.dir;
      window.dispatchEvent(new CustomEvent('eduai:language', { detail: t }));
    },
    init() { this.set(this.current()); }
  };
})();
