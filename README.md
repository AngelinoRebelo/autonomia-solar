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

O catálogo (Felicity, Pylontech, Deye/Growatt, Victron, …) vem com valores de datasheet e **tenta actualizar na rede** ao abrir ou no botão «Actualizar catálogo na rede». Sem internet usa o catálogo local.
