const entities = require('@jetbrains/youtrack-scripting-api/entities');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');

const FIBONACCI_LIMIT = [1, 2, 3, 5, 8, 13];
const VALID_STATES = ['Backlog', 'Refinement'];
const POKER_PREFIX = 'Poker ';

exports.rule = entities.Issue.onChange({
  title: 'Atualiza Story Points com base em votos de comentários Poker Fibonacci',
  guard: (ctx) => ctx.issue.comments.added.isNotEmpty(),
  action: (ctx) => {
    const issue = ctx.issue;
    console.log('Iniciando atualização de Story Points');
    const votos = new Map();
    const poGroup = entities.UserGroup.findByName('POs Team');

    issue.comments.forEach((comment) => {
      console.log(`Analisando comentário de ${comment.author.login}: "${comment.text}"`);
      if (comment.text.startsWith(POKER_PREFIX)) {
        let fibStr = comment.text.substring(POKER_PREFIX.length).trim();
        let fibNum = parseInt(fibStr, 10);

        if (isNaN(fibNum)) {
          console.log(`Valor não numérico por ${comment.author.login}: ${fibStr}`);
        } else {
          const maxFib = FIBONACCI_LIMIT.at(-1);
          if (fibNum > maxFib) {
            console.log(`Número acima do limite por ${comment.author.login}: ${fibNum}`);
          } else {
            if (!FIBONACCI_LIMIT.includes(fibNum)) {
              const nextFib = FIBONACCI_LIMIT.find(n => n > fibNum);
              console.log(`Número inválido de Fibonacci por ${comment.author.login}: ${fibNum}, arredondando para ${nextFib}`);
              fibNum = nextFib;
            }
            votos.set(comment.author.login, fibNum);
            console.log(`Último voto de ${comment.author.login} registrado como ${fibNum}`);

            comment.permittedGroups.clear();
            comment.permittedGroups.add(poGroup);
            console.log(`Comentário de ${comment.author.login} ocultado para não-POs`);
          }
        }
      }
    });

    console.log('Coleta de votos finalizada');
    const contagem = new Map();
    votos.forEach((ponto) => {
      contagem.set(ponto, (contagem.get(ponto) || 0) + 1);
    });
    console.log('Contagem de votos:', Array.from(contagem.entries()));

    let maxCount = 0;
    contagem.forEach((count) => {
      if (count > maxCount) maxCount = count;
    });

    const candidatos = [];
    contagem.forEach((count, ponto) => {
      if (count === maxCount) candidatos.push(ponto);
    });

    const pontoVencedor = candidatos.length ? Math.max(...candidatos) : null;
    console.log(`Vencedor definido: ponto=${pontoVencedor}, votos=${maxCount}`);

    if (pontoVencedor !== null) {
      const estadoAtual = issue.fields.State.name;
      if (VALID_STATES.includes(estadoAtual)) {
        issue.fields.StoryPoints = pontoVencedor;
        workflow.message(`Story Points atualizados para ${pontoVencedor}`);
      } else {
        workflow.message('Não é possível atualizar Story Points – estado inválido');
        console.log(`Estado inválido: ${estadoAtual}`);
      }
    } else {
      console.log('Nenhum voto válido encontrado');
    }
  },
  requirements: {
    StoryPoints: {
      name: 'Story points',
      type: entities.Field.integerType
    },
    State: {
      type: entities.State.fieldType,
      Backlog:    { name: 'Backlog' },
      Refinement: { name: 'Refinement' }
    }
  }
});
