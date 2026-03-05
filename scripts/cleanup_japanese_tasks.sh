#!/bin/bash

#
# Nettoie les Cloud Tasks Japanese orphelines
# Usage: ./scripts/cleanup_japanese_tasks.sh [--execute]
#

set -e

PROJECT="crown-476614"
LOCATION="europe-west1"
QUEUE="JaponeseRoundHandler"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DRY_RUN=true

if [[ "$1" == "--execute" ]]; then
  DRY_RUN=false
fi

echo -e "${BLUE}🔍 NETTOYAGE DES CLOUD TASKS JAPANESE${NC}\n"
echo "================================================"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}📊 MODE DRY-RUN - Aucune modification ne sera effectuée${NC}"
  echo ""
else
  echo -e "${RED}⚠️  MODE EXECUTION - Les tâches seront SUPPRIMÉES${NC}"
  echo ""
fi

# Get all tasks
echo "🔗 Récupération des tâches..."
TASK_COUNT=$(gcloud tasks list --queue=$QUEUE --location=$LOCATION --project=$PROJECT --format="value(name)" | wc -l | tr -d ' ')

echo -e "${GREEN}✅ $TASK_COUNT tâche(s) trouvée(s) dans $QUEUE${NC}"
echo ""

if [ "$TASK_COUNT" -eq 0 ]; then
  echo "🎉 Aucune tâche à nettoyer !"
  exit 0
fi

# Get task details with schedule times
echo "📊 Analyse des tâches..."
TEMP_FILE=$(mktemp)
gcloud tasks list --queue=$QUEUE --location=$LOCATION --project=$PROJECT --format="csv(name,scheduleTime)" > "$TEMP_FILE"

# Count tasks by time (past vs future)
NOW=$(date -u +%s)
PAST_TASKS=0
FUTURE_TASKS=0
OLD_TASKS=0 # Tasks older than 7 days

while IFS=, read -r task_name schedule_time; do
  # Skip header
  if [[ "$task_name" == "name" ]]; then
    continue
  fi
  
  if [[ -n "$schedule_time" ]]; then
    # Convert schedule time to timestamp
    SCHEDULE_TS=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${schedule_time:0:19}" +%s 2>/dev/null || echo "0")
    
    if [ "$SCHEDULE_TS" -lt "$NOW" ]; then
      ((PAST_TASKS++))
      
      # Check if older than 7 days
      SEVEN_DAYS_AGO=$((NOW - 604800))
      if [ "$SCHEDULE_TS" -lt "$SEVEN_DAYS_AGO" ]; then
        ((OLD_TASKS++))
      fi
    else
      ((FUTURE_TASKS++))
    fi
  fi
done < "$TEMP_FILE"

rm "$TEMP_FILE"

echo ""
echo "================================================"
echo -e "${BLUE}📊 RÉSULTATS${NC}"
echo ""
echo -e "Total tâches : ${YELLOW}$TASK_COUNT${NC}"
echo -e "Tâches passées (déjà en retard) : ${RED}$PAST_TASKS${NC}"
echo -e "  dont > 7 jours : ${RED}$OLD_TASKS${NC}"
echo -e "Tâches futures : ${GREEN}$FUTURE_TASKS${NC}"
echo ""

if [ "$FUTURE_TASKS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  ATTENTION : $FUTURE_TASKS tâche(s) programmée(s) pour le futur !${NC}"
  echo "   Vérifiez si ces tâches correspondent à des enchères réelles."
  echo ""
fi

# Decision
TASKS_TO_DELETE=$PAST_TASKS

if [ "$TASKS_TO_DELETE" -eq 0 ]; then
  echo -e "${GREEN}✅ Aucune tâche orpheline à supprimer${NC}"
  exit 0
fi

echo -e "${RED}🗑️  $TASKS_TO_DELETE tâche(s) orpheline(s) à supprimer${NC}"
echo ""

if [ "$DRY_RUN" = true ]; then
  echo -e "${YELLOW}💡 Pour exécuter la suppression, relancez avec:${NC}"
  echo "   ./scripts/cleanup_japanese_tasks.sh --execute"
  echo ""
  exit 0
fi

# Execute deletion
echo "🔧 Suppression en cours..."
echo ""

DELETED=0
ERRORS=0

# Get all past task names
gcloud tasks list --queue=$QUEUE --location=$LOCATION --project=$PROJECT --format="value(name,scheduleTime)" | while read -r task_name schedule_time; do
  if [[ -z "$task_name" ]]; then
    continue
  fi
  
  # Parse schedule time
  SCHEDULE_TS=$(date -j -f "%Y-%m-%dT%H:%M:%S" "${schedule_time:0:19}" +%s 2>/dev/null || echo "0")
  
  # Delete if in the past
  if [ "$SCHEDULE_TS" -lt "$NOW" ]; then
    if gcloud tasks delete "$task_name" --quiet 2>/dev/null; then
      ((DELETED++))
      if [ $((DELETED % 50)) -eq 0 ]; then
        echo "  Progression: $DELETED/$TASKS_TO_DELETE"
      fi
    else
      ((ERRORS++))
    fi
    
    # Small delay to avoid rate limits
    sleep 0.1
  fi
done

echo ""
echo -e "${GREEN}✅ Suppression terminée: $DELETED tâche(s) supprimée(s)${NC}"

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}❌ Erreurs: $ERRORS${NC}"
fi

# Verify
REMAINING=$(gcloud tasks list --queue=$QUEUE --location=$LOCATION --project=$PROJECT --format="value(name)" | wc -l | tr -d ' ')
echo ""
echo -e "📊 Vérification: ${GREEN}$REMAINING${NC} tâche(s) restante(s)"
echo ""
echo "✅ Nettoyage terminé"

