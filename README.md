# Autonomia Solar

Calculadora de **tempo de autonomia** de um banco de baterias atrás de um inversor, para o Ubuntu.

## Abrir

Menu de aplicações → **Autonomia Solar**, ou:

```bash
/home/machaddoo/PROJETOS/autonomia/bin/autonomia
```

## Cálculo

1. Energia após DoD: `capacidade × módulos × DoD`
2. Energia útil: isso × **eficiência da bateria** (perdas internas)
3. Dreno na bateria: `carga / eficiência do inversor + consumo vazio`
4. Autonomia: `energia útil / dreno`

O catálogo (Felicity, Pylontech, Deye/Growatt, Victron, …) traz **capacidade e eficiência oficiais** do fabricante ao escolher o modelo. DoD, módulos, consumo vazio e carga continuam editáveis. Sem internet usa o catálogo local; o botão «Actualizar catálogo na rede» tenta datasheets oficiais.

O app **local no Ubuntu** continua no menu **Autonomia Solar**. O mesmo código também corre como site (Railway).
