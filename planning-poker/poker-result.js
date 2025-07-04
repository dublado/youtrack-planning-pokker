const entities = require('@jetbrains/youtrack-scripting-api/entities');
const workflow = require('@jetbrains/youtrack-scripting-api/workflow');


exports.rule = entities.Issue.action({
  title: 'Post or Update Poker Votes Summary',
  command: 'poker-result',
  guard: ctx => ctx.currentUser.isInGroup('POs Team'),
  action: ctx => {
    const issue = ctx.issue;
    console.log('Iniciando resumo de votos Poker');

    const FIBONACCI = [1, 2, 3, 5, 8, 13];
    const POKER_PREFIX = 'Poker ';
    const votos = new Map();
    const poGroup = entities.UserGroup.findByName('POs Team');

    // 1. Coleta o último voto válido de cada usuário e oculta o comentário
    issue.comments.forEach(comment => {
      if (!comment.text.startsWith(POKER_PREFIX)) return;

      let num = parseInt(comment.text.substring(POKER_PREFIX.length).trim(), 10);
      if (isNaN(num) || num < 1) {
        console.log(`Valor inválido ou não numérico em "${comment.text}"`);
        return;
      }
      if (num > FIBONACCI.at(-1)) {
        console.log(`Valor acima do limite em ${num}, ignorado`);
        return;
      }
      if (!FIBONACCI.includes(num)) {
        const next = FIBONACCI.find(n => n > num);
        console.log(`Arredondando ${num} para próximo Fibonacci ${next}`);
        num = next;
      }
      votos.set(comment.author.login, num);
      comment.permittedGroups.clear();
      comment.permittedGroups.add(poGroup);
      console.log(`Voto de ${comment.author.login}: ${num} (oculto para não-POs)`);
    });

    // 2. Conta votos e calcula resultado
    const contagem = new Map();
    votos.forEach(v => contagem.set(v, (contagem.get(v) || 0) + 1));

    let maxCount = 0;
    contagem.forEach(c => { if (c > maxCount) maxCount = c });

    const candidatos = [];
    contagem.forEach((c, v) => { if (c === maxCount) candidatos.push(v) });

    const resultado = candidatos.length
      ? Math.max(...candidatos)
      : null;
    const criterio = candidatos.length > 1
      ? 'em caso de empate, escolheu o valor mais alto'
      : 'sem empate';

    console.log('Contagem final:', Array.from(contagem.entries()));
    console.log(`Resultado: ${resultado} (${criterio})`);

    // 3. Monta o comentário de resumo (público)
    const linhas = [
      '**Resumo de Votos Poker:**',
      '',
      '**Votos válidos:**'
    ];
    votos.forEach((v, u) => linhas.push(`- ${u}: ${v}`));
    linhas.push(
      '',
      `**Resultado final:** ${resultado}`,
      `**Critério adotado:** ${criterio}`
    );

    const body = linhas.join('\n');
    const existing = issue.comments.find(c =>
      c.text.startsWith('**Resumo de Votos Poker:**')
    );

    if (existing) {
      existing.text = body;
      existing.isUsingMarkdown = true;
      workflow.message('Resumo de votos atualizado.');
    } else {
      const comment = issue.addComment(body, ctx.currentUser);
      comment.isUsingMarkdown = true;
      workflow.message('Resumo de votos postado.');
    }
  },
  requirements: {
     }
});
