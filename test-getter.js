/**
 * TEST POUR VÉRIFIER LE GETTER SEQUELIZE
 */

const { Ticket } = require('./src/db/sequelize');

async function testGetter() {
  try {
    console.log('🔍 === TEST DU GETTER SEQUELIZE ===');
    
    // Récupérer un ticket spécifique qui pose problème
    const ticket = await Ticket.findByPk(294); // Ticket Two Sûrs qui devrait gagner
    
    if (!ticket) {
      console.log('❌ Ticket 294 non trouvé');
      return;
    }
    
    console.log(`📋 Ticket ${ticket.id}:`);
    console.log(`🎯 numerosJoues (via getter): `, ticket.numerosJoues);
    console.log(`🔍 Type de numerosJoues: ${typeof ticket.numerosJoues}`);
    console.log(`🔍 Est-ce un tableau? ${Array.isArray(ticket.numerosJoues)}`);
    
    // Tester l'accès direct aux données brutes
    const rawValue = ticket.getDataValue('numerosJoues');
    console.log(`📊 Valeur brute en base: `, rawValue);
    console.log(`🔍 Type de la valeur brute: ${typeof rawValue}`);
    
    // Test de parsing manuel
    if (typeof rawValue === 'string') {
      try {
        const parsed = JSON.parse(rawValue);
        console.log(`✅ Parsing manuel réussi: `, parsed);
        console.log(`🔍 Type après parsing: ${typeof parsed}`);
        console.log(`🔍 Est-ce un tableau après parsing? ${Array.isArray(parsed)}`);
      } catch (error) {
        console.log(`❌ Erreur parsing manuel: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testGetter();
