import pg from 'pg'

/**
 * ⚠️ **DANGER - SQL INJECTION RISK** ⚠️
 *
 * Execute une requête SQL brute sans paramètres préparés.
 *
 * **CETTE FONCTION EST DANGEREUSE ET NE DOIT JAMAIS ÊTRE UTILISÉE AVEC DES ENTRÉES UTILISATEUR !**
 *
 * ❌ **NE JAMAIS FAIRE :**
 * ```javascript
 * // VULNÉRABLE À L'INJECTION SQL !
 * const userId = req.body.userId
 * await executeRawQuery(`DELETE FROM users WHERE id = '${userId}'`)
 * ```
 *
 * ✅ **À LA PLACE, UTILISER DES PARAMÈTRES PRÉPARÉS :**
 * ```javascript
 * const { data, error } = await supabase
 *   .from('users')
 *   .delete()
 *   .eq('id', userId)  // Paramètres automatiquement échappés
 * ```
 *
 * **Cas d'usage acceptables (UNIQUEMENT) :**
 * - Scripts d'administration internes (migrations, seeds)
 * - Requêtes SQL statiques codées en dur (sans variables)
 * - Opérations DDL (CREATE TABLE, ALTER, etc.)
 *
 * **Avant d'utiliser cette fonction, posez-vous ces questions :**
 * 1. Est-ce que j'utilise des données venant de l'utilisateur ? → ❌ NE PAS UTILISER
 * 2. Est-ce que je peux faire ça avec Supabase Query Builder ? → ✅ UTILISER Query Builder
 * 3. Est-ce une opération admin ponctuelle ? → ✅ OK, mais documenter
 *
 * @param {string} sql - Requête SQL brute (DOIT être statique, JAMAIS interpolée avec des variables externes)
 * @returns {Promise<void>}
 * @throws {Error} Si la connexion ou la requête échoue
 *
 * @example
 * // ✅ OK - Requête statique pour migration
 * await executeRawQuery('CREATE INDEX idx_users_email ON users(email)')
 *
 * @example
 * // ❌ DANGEREUX - Interpolation de variables
 * const tableName = req.body.table
 * await executeRawQuery(`DROP TABLE ${tableName}`) // INJECTION SQL !
 */
export async function executeRawQuery(sql) {
  // Validation basique : détecter les interpolations évidentes
  if (typeof sql !== 'string') {
    throw new Error('[executeRawQuery] SQL parameter must be a string')
  }

  if (sql.trim().length === 0) {
    throw new Error('[executeRawQuery] SQL query cannot be empty')
  }

  // Avertissement en console pour traçabilité
  console.warn(
    '[executeRawQuery] ⚠️  Executing raw SQL query. Ensure this is safe and does not use user input!'
  )

  const client = new pg.Client(process.env.PG_URL)

  await client.connect()
  try {
    await client.query(sql)
  } finally {
    await client.end()
  }
}
