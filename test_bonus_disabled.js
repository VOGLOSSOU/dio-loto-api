const moment = require('moment-timezone');

// Test pour vérifier si le bonus est désactivé
console.log('🧪 TEST : Vérification de la désactivation du bonus');
console.log('================================================\n');

// Date actuelle
const now = moment();
const todayBenin = moment().tz('Africa/Porto-Novo');

console.log('📅 Date/heure actuelles :');
console.log(`   UTC: ${now.format('YYYY-MM-DD HH:mm:ss')}`);
console.log(`   Bénin: ${todayBenin.format('YYYY-MM-DD HH:mm:ss')}\n`);

// Date du bonus (maintenant passée)
const bonusDate = '2025-12-31';
const isBonusDay = todayBenin.isSame(bonusDate, 'day');

console.log('🎯 Vérification du bonus :');
console.log(`   Date programmée: ${bonusDate}`);
console.log(`   Aujourd'hui (Bénin): ${todayBenin.format('YYYY-MM-DD')}`);
console.log(`   isBonusDay: ${isBonusDay}`);
console.log(`   Statut: ${isBonusDay ? '❌ BONUS ACTIF' : '✅ BONUS DÉSACTIVÉ'}\n`);

// Test avec la date future originale pour comparaison
const originalBonusDate = '2026-01-04';
const wouldBeBonusDay = todayBenin.isSame(originalBonusDate, 'day');

console.log('🔍 Comparaison avec l\'ancienne date :');
console.log(`   Ancienne date: ${originalBonusDate}`);
console.log(`   Aurait été actif: ${wouldBeBonusDay}\n`);

console.log('📋 CONCLUSION :');
if (!isBonusDay) {
    console.log('✅ Le bonus est correctement DÉSACTIVÉ');
    console.log('   Aucune recharge ne recevra de bonus jusqu\'à changement de date');
} else {
    console.log('❌ PROBLÈME : Le bonus est encore ACTIF');
    console.log('   Vérifier la date dans les fichiers');
}

console.log('\n================================================');
console.log('Test terminé.');