# Autonomia Solar

Calculadora de **tempo de autonomia** de um banco de baterias atrás de um inversor, para o Ubuntu.

## Abrir

Menu de aplicações → **Autonomia Solar**, ou:

```bash
/home/machaddoo/PROJETOS/autonomia/bin/autonomia
```

## Cálculo

**Autonomia (descarga)**

1. Energia após DoD: `capacidade × módulos × DoD`
2. Energia útil: isso × **eficiência da bateria** (perdas internas)
3. Dreno na bateria: `carga / eficiência do inversor + consumo vazio`
4. Autonomia: `energia útil / dreno`

**Geração e carga (placas)**

1. Pico STC: `quantidade × Wp oficial` (Jinko, JA, Trina, LONGi, Canadian, …)
2. Após perdas de campo (sujidade, temperatura, cabos): × `(1 − perdas de campo)`
3. Após MPPT oficial do inversor: × `η MPPT`
4. Na bateria: × **eficiência da bateria** (perdas de carga); o consumo vazio do inversor é descontado
5. Energia / dia: potência armazenada × **horas de sol pico (PSH)**
6. Tempo para encher o banco: energia após DoD / potência líquida na bateria  
   Com a carga AC ligada, o dreno do inversor é descontado; se o saldo for ≤ 0, o banco **não carrega**.

O catálogo traz **capacidade, eficiência, Wp e MPPT oficiais** do fabricante ao escolher o modelo. DoD, módulos, quantidade de placas, perdas de campo, PSH, consumo vazio e carga continuam editáveis. Sem internet usa o catálogo local; o botão «Actualizar catálogo na rede» tenta datasheets oficiais.

O app **local no Ubuntu** continua no menu **Autonomia Solar**. O mesmo código também corre como site (Railway).

- Código: https://github.com/AngelinoRebelo/autonomia-solar
- Site: https://bateriacapacidade.up.railway.app
  (cada `git push` na `master` faz deploy automático no Railway)
