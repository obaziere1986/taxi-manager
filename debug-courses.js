// Test de debugging pour vérifier l'accès aux courses
// À exécuter dans la console du navigateur

console.log("🔍 Test de récupération des courses...");

fetch('/api/courses')
  .then(response => {
    console.log("📡 Statut réponse:", response.status);
    return response.json();
  })
  .then(data => {
    console.log("📊 Données courses:", data);
    if (Array.isArray(data)) {
      console.log(`✅ ${data.length} courses trouvées`);
      if (data.length > 0) {
        console.log("📝 Première course:", data[0]);
      }
    } else {
      console.log("❌ Erreur dans les données:", data);
    }
  })
  .catch(error => {
    console.error("💥 Erreur de fetch:", error);
  });

// Test des analytics courses
fetch('/api/analytics/courses-timeline')
  .then(response => response.json())
  .then(data => {
    console.log("📈 Analytics courses:", data);
  })
  .catch(error => {
    console.error("💥 Erreur analytics:", error);
  });