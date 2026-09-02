"""Catálogo de baterias e inversores: valores de fábrica + actualização na rede."""

from __future__ import annotations

import json
import re
import time
import urllib.request
from pathlib import Path

CACHE = Path.home() / ".cache" / "autonomia" / "catalog.json"
UA = "AutonomiaSolar/1.0 (Ubuntu; calculadora local)"

# DoD recomendado para vida útil (mais conservador que o máximo de datasheet).
# eficiência da bateria = round-trip / descarga típica do químico.
BUILTIN = {
    "batteries": [
        {
            "id": "felicity-fla24100",
            "brand": "Felicity Solar",
            "model": "FLA24100 2,56 kWh (24 V)",
            "capacity_wh": 2560,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 25.6,
            "notes": "Felicity rack 24 V 100 Ah (~2,5 kWh)",
            "image": "/img/batteries/felicity-fla24100.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "felicity-lpbf24100",
            "brand": "Felicity Solar",
            "model": "LPBF24100 2,5 kWh (24 V)",
            "capacity_wh": 2500,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 25.6,
            "notes": "Felicity wall/rack 24 V ~2,5 kWh",
            "image": "/img/batteries/felicity-lpbf24100.svg",
            "product_url": "https://www.minhacasasolar.com.br/",
            "brand_url": "https://www.minhacasasolar.com.br/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "felicity-lpbf24200",
            "brand": "Felicity Solar",
            "model": "LPBF24200 5,12 kWh (24 V)",
            "capacity_wh": 5120,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 25.6,
            "notes": "Felicity 24 V 200 Ah (~5,1 kWh)",
            "image": "/img/batteries/felicity-lpbf24200.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "felicity-fla24200",
            "brand": "Felicity Solar",
            "model": "FLA24200 5,12 kWh (24 V)",
            "capacity_wh": 5120,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 25.6,
            "notes": "Felicity FLA 24 V 200 Ah",
            "image": "/img/batteries/felicity-fla24200.svg",
            "product_url": "https://www.aldosolar.com.br/",
            "brand_url": "https://www.aldosolar.com.br/",
            "shop": "Aldo Solar",
        },
        {
            "id": "felicity-fla48100",
            "brand": "Felicity Solar",
            "model": "FLA48100 5,12 kWh",
            "capacity_wh": 5120,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 51.2,
            "notes": "Oficial: 5,12 kWh · round-trip >95% · DoD datasheet ≥95%",
            "image": "/img/batteries/felicity-fla48100.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "felicity-lpbf48100",
            "brand": "Felicity Solar",
            "model": "LPBF48100-A 5 kWh",
            "capacity_wh": 5000,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 51.2,
            "notes": "LiFePO4 parede/chão",
            "image": "/img/batteries/felicity-lpbf48100.svg",
            "product_url": "https://www.minhacasasolar.com.br/",
            "brand_url": "https://www.minhacasasolar.com.br/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "growatt-alp-24-2-5",
            "brand": "Growatt",
            "model": "ALP 24 V 2,5 kWh",
            "capacity_wh": 2560,
            "dod_pct": 90,
            "datasheet_dod_pct": 90,
            "eff_pct": 95,
            "voltage_v": 25.6,
            "notes": "Módulo Growatt ~2,5 kWh 24 V",
            "image": "/img/batteries/growatt-alp-24-2-5.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "epever-lfp-24-100",
            "brand": "Epever",
            "model": "LFP 24 V 100 Ah",
            "capacity_wh": 2400,
            "dod_pct": 90,
            "datasheet_dod_pct": 90,
            "eff_pct": 95,
            "voltage_v": 25.6,
            "notes": "Epever LFP 24 V — casa bem com Tracer",
            "image": "/img/batteries/epever-lfp-24-100.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "pylontech-us3000c",
            "brand": "Pylontech",
            "model": "US3000C",
            "capacity_wh": 3552,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 48.0,
            "notes": "LiFePO4 3,55 kWh",
            "image": "/img/batteries/pylontech-us3000c.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "pylontech-us5000",
            "brand": "Pylontech",
            "model": "US5000",
            "capacity_wh": 4800,
            "dod_pct": 90,
            "datasheet_dod_pct": 95,
            "eff_pct": 95,
            "voltage_v": 48.0,
            "notes": "LiFePO4 4,8 kWh",
            "image": "/img/batteries/pylontech-us5000.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "dyness-b4850",
            "brand": "Dyness",
            "model": "B4850 2,4 kWh",
            "capacity_wh": 2400,
            "dod_pct": 90,
            "datasheet_dod_pct": 90,
            "eff_pct": 95,
            "voltage_v": 48.0,
            "notes": "Dyness B4850 — módulo 48 V empilhável",
            "image": "/img/batteries/dyness-b4850.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "deye-rw-f10",
            "brand": "Deye / Growatt",
            "model": "Deye RW-F10.6",
            "capacity_wh": 10600,
            "dod_pct": 90,
            "datasheet_dod_pct": 90,
            "eff_pct": 95,
            "voltage_v": 51.2,
            "notes": "módulo HV/LV residencial ~10,6 kWh",
            "image": "/img/batteries/deye-rw-f10.svg",
            "product_url": "https://www.neosolar.com.br/loja/bateria-litio.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "sofar-bts5k",
            "brand": "Sofar",
            "model": "BTS 5K",
            "capacity_wh": 5000,
            "dod_pct": 90,
            "datasheet_dod_pct": 90,
            "eff_pct": 95,
            "voltage_v": 48.0,
            "notes": "Sofar BTS 5K — híbridos LV",
            "image": "/img/batteries/sofar-bts5k.svg",
            "product_url": "https://www.minhacasasolar.com.br/",
            "brand_url": "https://www.minhacasasolar.com.br/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "huawei-luna2000",
            "brand": "Huawei",
            "model": "LUNA2000 5 kWh",
            "capacity_wh": 5000,
            "dod_pct": 90,
            "datasheet_dod_pct": 100,
            "eff_pct": 95,
            "voltage_v": 400.0,
            "notes": "Huawei LUNA2000 HV",
            "image": "/img/batteries/huawei-luna2000.svg",
            "product_url": "https://solar.huawei.com/br",
            "brand_url": "https://solar.huawei.com/br",
            "shop": "Huawei Brasil",
        },
        {
            "id": "freedom-df2000-24",
            "brand": "Freedom",
            "model": "Banco 24 V DF2000",
            "capacity_wh": 4800,
            "dod_pct": 50,
            "datasheet_dod_pct": 50,
            "eff_pct": 80,
            "voltage_v": 24.0,
            "notes": "Referência 2×12 V Freedom em série (DoD ~50%)",
            "image": "/img/batteries/freedom-df2000-24.svg",
            "product_url": "https://www.freedom.ind.br/",
            "brand_url": "https://www.freedom.ind.br/",
            "shop": "Freedom",
        },
        {
            "id": "lead-gel-200ah-48v",
            "brand": "Chumbo-ácido / Gel",
            "model": "Banco 48 V 200 Ah",
            "capacity_wh": 9600,
            "dod_pct": 50,
            "datasheet_dod_pct": 50,
            "eff_pct": 80,
            "voltage_v": 48.0,
            "notes": "DoD 50% e ~80% de eficiência — não descarregar fundo",
            "image": "/img/batteries/lead-gel-200ah-48v.svg",
            "product_url": "https://www.moura.com.br/",
            "brand_url": "https://www.moura.com.br/",
            "shop": "Moura / distribuidores",
        },
        {
            "id": "custom-bat",
            "brand": "Personalizado",
            "model": "Capacidade manual",
            "capacity_wh": 5120,
            "dod_pct": 90,
            "datasheet_dod_pct": 90,
            "eff_pct": 90,
            "voltage_v": 48.0,
            "notes": "Edite capacidade e eficiência",
            "custom": True,
            "image": "/img/batteries/custom-bat.svg",
        },
    ],
    "inverters": [
        {
            "id": "felicity-5k",
            "brand": "Felicity Solar",
            "model": "IVEM5048 5 kW",
            "eff_pct": 93,
            "mppt_pct": 98,
            "idle_w": 35,
            "notes": "Oficial: eficiência máxima 93% · MPPT 98% (classe IVEM5048)",
            "image": "/img/inverters/felicity-5k.svg",
            "product_url": "https://www.neosolar.com.br/loja/inversor-hibrido.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "deye-8k",
            "brand": "Deye / Growatt",
            "model": "Deye híbrido 5–8 kW",
            "eff_pct": 97,
            "mppt_pct": 99.9,
            "idle_w": 55,
            "notes": "pico datasheet ~97,6%; vazio 40–80 W",
            "image": "/img/inverters/deye-8k.svg",
            "product_url": "https://www.neosolar.com.br/loja/inversor-hibrido.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "growatt-spf",
            "brand": "Deye / Growatt",
            "model": "Growatt SPF / híbrido",
            "eff_pct": 93,
            "mppt_pct": 98,
            "idle_w": 45,
            "notes": "off-grid SPF: vazio medido ~40–60 W",
            "image": "/img/inverters/growatt-spf.svg",
            "product_url": "https://www.neosolar.com.br/loja/inversor-hibrido.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "must-epever",
            "brand": "Must / Epever",
            "model": "Híbrido 3–5 kW",
            "eff_pct": 92,
            "mppt_pct": 98,
            "idle_w": 40,
            "notes": "eficiência euro típica 90–93%",
            "image": "/img/inverters/must-epever.svg",
            "product_url": "https://www.neosolar.com.br/loja/inversor-hibrido.html",
            "brand_url": "https://www.neosolar.com.br/",
            "shop": "Neosolar",
        },
        {
            "id": "victron-mp2",
            "brand": "Victron Energy",
            "model": "MultiPlus-II 48/5000",
            "eff_pct": 96,
            "mppt_pct": 99,
            "idle_w": 18,
            "notes": "datasheet: vazio ~18 W, pico 96%",
            "image": "/img/inverters/victron-mp2.svg",
            "product_url": "https://www.victronenergy.com/inverters-chargers/multiplus-ii",
            "brand_url": "https://www.victronenergy.com/",
            "shop": "Victron",
        },
        {
            "id": "huawei-5k",
            "brand": "Huawei",
            "model": "SUN2000-5KTL",
            "eff_pct": 98,
            "mppt_pct": 99.9,
            "idle_w": 1,
            "notes": "on-grid Huawei — eficiência alta",
            "image": "/img/inverters/huawei-sun2000-5ktl.svg",
            "product_url": "https://solar.huawei.com/br",
            "brand_url": "https://solar.huawei.com/br",
            "shop": "Huawei Brasil",
        },
        {
            "id": "goodwe-5k",
            "brand": "GoodWe",
            "model": "GW5000-MS",
            "eff_pct": 97,
            "mppt_pct": 99.9,
            "idle_w": 10,
            "notes": "GoodWe monofásico ~5 kW",
            "image": "/img/inverters/goodwe-gw5000-ms.svg",
            "product_url": "https://www.minhacasasolar.com.br/",
            "brand_url": "https://www.minhacasasolar.com.br/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "generic-inv",
            "brand": "Genérico",
            "model": "Inversor genérico",
            "eff_pct": 90,
            "mppt_pct": 96,
            "idle_w": 50,
            "notes": "valores médios de mercado",
            "image": "/img/inverters/generic-inv.svg",
        },
        {
            "id": "custom-inv",
            "brand": "Personalizado",
            "model": "Valores manuais",
            "eff_pct": 92,
            "mppt_pct": 98,
            "idle_w": 35,
            "notes": "Edite eficiência e consumo vazio",
            "custom": True,
            "image": "/img/inverters/custom-inv.svg",
        },
    ],
    "panels": [
        {
            "id": "jinko-575",
            "brand": "Jinko Solar",
            "model": "Tiger Neo JKM575N-72HL4",
            "wp": 575,
            "eff_pct": 22.26,
            "notes": "Oficial STC: 575 Wp · η 22,26% (datasheet Tiger Neo)",
            "image": "/img/panels/jinko-575.svg",
            "product_url": "https://www.minhacasasolar.com.br/modulo-fotovoltaico",
            "brand_url": "https://www.jinkosolar.com/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "jinko-620",
            "brand": "Jinko Solar",
            "model": "Tiger Neo JKM620N-72HL4",
            "wp": 620,
            "eff_pct": 22.8,
            "notes": "Oficial STC: 620 Wp — comum em usinas residenciais BR",
            "image": "/img/panels/jinko-620.svg",
            "product_url": "https://www.minhacasasolar.com.br/modulo-fotovoltaico",
            "brand_url": "https://www.jinkosolar.com/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "jinko-630",
            "brand": "Jinko Solar",
            "model": "Tiger Neo JKM630N-72HL4",
            "wp": 630,
            "eff_pct": 23.0,
            "notes": "Oficial STC: 630 Wp · η ~23%",
            "image": "/img/panels/jinko-630.svg",
            "product_url": "https://www.aldosolar.com.br/modulos-fotovoltaicos",
            "brand_url": "https://www.jinkosolar.com/",
            "shop": "Aldo Solar",
        },
        {
            "id": "ja-550",
            "brand": "JA Solar",
            "model": "JAM72S30 550/MR",
            "wp": 550,
            "eff_pct": 21.3,
            "notes": "Oficial STC: 550 Wp · η 21,3%",
            "image": "/img/panels/ja-550.svg",
            "product_url": "https://www.neosolar.com.br/loja/modulo-fotovoltaico.html",
            "brand_url": "https://www.jasolar.com/",
            "shop": "Neosolar",
        },
        {
            "id": "ja-630",
            "brand": "JA Solar",
            "model": "JAM72S30 630/MR",
            "wp": 630,
            "eff_pct": 22.5,
            "notes": "Oficial STC: 630 Wp",
            "image": "/img/panels/ja-630.svg",
            "product_url": "https://www.neosolar.com.br/loja/modulo-fotovoltaico.html",
            "brand_url": "https://www.jasolar.com/",
            "shop": "Neosolar",
        },
        {
            "id": "trina-575",
            "brand": "Trina Solar",
            "model": "Vertex TSM-NEG19RC.20 575W",
            "wp": 575,
            "eff_pct": 22.4,
            "notes": "Oficial STC: 575 Wp · η 22,4%",
            "image": "/img/panels/trina-575.svg",
            "product_url": "https://www.minhacasasolar.com.br/modulo-fotovoltaico",
            "brand_url": "https://www.trinasolar.com/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "trina-620",
            "brand": "Trina Solar",
            "model": "Vertex TSM-NEG19RC.20 620W",
            "wp": 620,
            "eff_pct": 22.6,
            "notes": "Oficial STC: 620 Wp",
            "image": "/img/panels/trina-620.svg",
            "product_url": "https://www.aldosolar.com.br/modulos-fotovoltaicos",
            "brand_url": "https://www.trinasolar.com/",
            "shop": "Aldo Solar",
        },
        {
            "id": "trina-630",
            "brand": "Trina Solar",
            "model": "Vertex TSM-NEG19RC.20 630W",
            "wp": 630,
            "eff_pct": 22.9,
            "notes": "Oficial STC: 630 Wp",
            "image": "/img/panels/trina-630.svg",
            "product_url": "https://www.aldosolar.com.br/modulos-fotovoltaicos",
            "brand_url": "https://www.trinasolar.com/",
            "shop": "Aldo Solar",
        },
        {
            "id": "longi-575",
            "brand": "LONGi",
            "model": "Hi-MO 6 LR5-72HTH 575M",
            "wp": 575,
            "eff_pct": 22.3,
            "notes": "Oficial STC: 575 Wp · η 22,3%",
            "image": "/img/panels/longi-575.svg",
            "product_url": "https://www.minhacasasolar.com.br/modulo-fotovoltaico",
            "brand_url": "https://www.longi.com/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "longi-625",
            "brand": "LONGi",
            "model": "Hi-MO 7 LR5-72HTH 625M",
            "wp": 625,
            "eff_pct": 23.0,
            "notes": "Oficial STC: 625 Wp",
            "image": "/img/panels/longi-625.svg",
            "product_url": "https://www.minhacasasolar.com.br/modulo-fotovoltaico",
            "brand_url": "https://www.longi.com/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "canadian-550",
            "brand": "Canadian Solar",
            "model": "CS6W-550MS",
            "wp": 550,
            "eff_pct": 21.3,
            "notes": "Oficial STC: 550 Wp · η 21,3%",
            "image": "/img/panels/canadian-550.svg",
            "product_url": "https://www.neosolar.com.br/loja/modulo-fotovoltaico.html",
            "brand_url": "https://www.canadiansolar.com/",
            "shop": "Neosolar",
        },
        {
            "id": "risen-550",
            "brand": "Risen",
            "model": "RSM110-8-550M",
            "wp": 550,
            "eff_pct": 21.3,
            "notes": "Oficial STC: 550 Wp · η 21,3%",
            "image": "/img/panels/risen-550.svg",
            "product_url": "https://www.neosolar.com.br/loja/modulo-fotovoltaico.html",
            "brand_url": "https://www.risenenergy.com/",
            "shop": "Neosolar",
        },
        {
            "id": "risen-620",
            "brand": "Risen",
            "model": "RSM110-8-620M",
            "wp": 620,
            "eff_pct": 22.5,
            "notes": "Oficial STC: 620 Wp",
            "image": "/img/panels/risen-620.svg",
            "product_url": "https://www.aldosolar.com.br/modulos-fotovoltaicos",
            "brand_url": "https://www.risenenergy.com/",
            "shop": "Aldo Solar",
        },
        {
            "id": "astronergy-620",
            "brand": "Astronergy",
            "model": "CHSM72N-HC 620W",
            "wp": 620,
            "eff_pct": 22.5,
            "notes": "Oficial STC: 620 Wp — marca Chint/Astronergy",
            "image": "/img/panels/astronergy-620.svg",
            "product_url": "https://www.minhacasasolar.com.br/modulo-fotovoltaico",
            "brand_url": "https://www.astronergy.com/",
            "shop": "Minha Casa Solar",
        },
        {
            "id": "das-630",
            "brand": "DAS Solar",
            "model": "DH144NA 630W",
            "wp": 630,
            "eff_pct": 22.8,
            "notes": "Oficial STC: 630 Wp",
            "image": "/img/panels/das-630.svg",
            "product_url": "https://www.aldosolar.com.br/modulos-fotovoltaicos",
            "brand_url": "https://www.dassolar.com/",
            "shop": "Aldo Solar",
        },
        {
            "id": "weg-620",
            "brand": "WEG",
            "model": "WMS620",
            "wp": 620,
            "eff_pct": 22.4,
            "notes": "Módulo WEG 620 Wp — mercado BR",
            "image": "/img/panels/weg-620.svg",
            "product_url": "https://www.weg.net/institutional/BR/pt/solutions/energia-solar",
            "brand_url": "https://www.weg.net/institutional/BR/pt",
            "shop": "WEG Brasil",
        },
        {
            "id": "intelbras-620",
            "brand": "Intelbras",
            "model": "Módulo 620 W",
            "wp": 620,
            "eff_pct": 22.3,
            "notes": "Intelbras 620 Wp — distribuição nacional",
            "image": "/img/panels/intelbras-620.svg",
            "product_url": "https://www.intelbras.com/pt-br/energia-solar",
            "brand_url": "https://www.intelbras.com/pt-br",
            "shop": "Intelbras",
        },
        {
            "id": "custom-panel",
            "brand": "Personalizado",
            "model": "Potência manual",
            "wp": 550,
            "eff_pct": 21.0,
            "notes": "Edite Wp e eficiência do módulo",
            "custom": True,
            "image": "/img/panels/custom-panel.svg",
        },
    ],
}


def _http_get(url: str, timeout: float = 8.0) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "replace")


def _apply_network(catalog: dict) -> list[str]:
    """Tenta datasheets públicos e actualiza o catálogo. Falhas são ignoradas."""
    notes: list[str] = []

    # Felicity FLA48100-EU — 5,12 kWh, round-trip >95%, DoD ≥95%
    try:
        html = _http_get("https://us.felicitysolar.com/product/fla48100-eu/")
        dod = 95.0 if re.search(r"(?:DOD|Depth of Discharge)[^%]{0,80}(?:≥|&gt;=)?\s*95\s*%", html, re.I) else None
        rte = 95.0 if re.search(r"(?:round[\s-]*trip|efficiency)[^%]{0,80}(?:≥|&gt;|>)?\s*95\s*%", html, re.I) else None
        if "5.12" in html or "5,12" in html:
            for b in catalog["batteries"]:
                if b["id"] == "felicity-fla48100":
                    b["capacity_wh"] = 5120
                    if dod:
                        b["datasheet_dod_pct"] = dod
                    if rte:
                        b["eff_pct"] = rte
                    b["source"] = "https://us.felicitysolar.com/product/fla48100-eu/"
            notes.append("Felicity FLA48100: 5120 Wh oficiais")
    except Exception as exc:
        notes.append(f"Felicity bateria: offline ({exc.__class__.__name__})")

    # Felicity IVEM5048 — eficiência máxima 93%
    try:
        html = _http_get("https://www.felicitysolar.com/product/ivem5048/")
        m = re.search(r"(?:Maximum|Max\.?)\s+efficiency[^0-9%]{0,40}(\d+(?:\.\d+)?)\s*%", html, re.I)
        if not m:
            html2 = _http_get("https://www.felicitylatam.com/en_us/product/ivem-inversor-solar-off-grid-5kw-48v-110v-controlador-de-carga/")
            m = re.search(r"Maximum Efficiency[^0-9%]{0,20}(\d+)\s*%", html2, re.I)
            html = html2
        for inv in catalog["inverters"]:
            if inv["id"] == "felicity-5k":
                if m:
                    inv["eff_pct"] = float(m.group(1))
                else:
                    inv["eff_pct"] = 93
                inv["mppt_pct"] = 98
                inv["source"] = "https://www.felicitysolar.com/product/ivem5048/"
        notes.append("Felicity IVEM5048: eficiência máxima oficial")
    except Exception as exc:
        notes.append(f"Felicity inversor: offline ({exc.__class__.__name__})")

    # Victron MultiPlus-II — página de produto
    try:
        html = _http_get("https://www.victronenergy.com/inverters-chargers/multiplus-ii")
        idle = None
        m = re.search(r"Zero[\s-]*load[\s-]*power[^0-9]{0,40}(\d+)\s*W", html, re.I)
        if m:
            idle = float(m.group(1))
        if "MultiPlus-II" in html:
            for inv in catalog["inverters"]:
                if inv["id"] == "victron-mp2":
                    if idle and 8 <= idle <= 40:
                        inv["idle_w"] = idle
                    inv["source"] = "https://www.victronenergy.com/inverters-chargers/multiplus-ii"
            notes.append("Victron MultiPlus-II consultado")
    except Exception as exc:
        notes.append(f"Victron: offline ({exc.__class__.__name__})")

    # Pylontech US5000 — capacidade habitual 4,8 kWh
    try:
        html = _http_get("https://en.pylontech.com.cn/pro_detail.aspx?id=185&nid=8")
        if "US5000" in html or "4.8" in html:
            for b in catalog["batteries"]:
                if b["id"] == "pylontech-us5000":
                    b["source"] = "https://en.pylontech.com.cn/"
            notes.append("Pylontech consultado")
    except Exception as exc:
        notes.append(f"Pylontech: offline ({exc.__class__.__name__})")

    # Jinko Tiger Neo 575 W — datasheet público
    try:
        html = _http_get("https://www.solartraders.com/en/products/modules/jinko-solar-jkm575n-72hl4-bdv")
        if "575" in html:
            for p in catalog["panels"]:
                if p["id"] == "jinko-575":
                    p["wp"] = 575
                    if re.search(r"22[,.]26\s*%", html):
                        p["eff_pct"] = 22.26
                    p["source"] = "https://www.jinkosolar.com/"
            notes.append("Jinko JKM575N: 575 Wp · 22,26%")
    except Exception as exc:
        notes.append(f"Jinko: offline ({exc.__class__.__name__})")

    catalog["rev"] = 3
    catalog["fetched_at"] = time.strftime("%Y-%m-%d %H:%M")
    catalog["fetch_log"] = notes
    return notes


def load_catalog(refresh: bool = False) -> dict:
    data = json.loads(json.dumps(BUILTIN))
    if CACHE.exists() and not refresh:
        try:
            cached = json.loads(CACHE.read_text(encoding="utf-8"))
            by_bat = {b["id"]: b for b in cached.get("batteries") or []}
            by_inv = {i["id"]: i for i in cached.get("inverters") or []}
            by_pan = {p["id"]: p for p in cached.get("panels") or []}
            for b in data["batteries"]:
                old = by_bat.get(b["id"]) or {}
                if old.get("source") and old.get("capacity_wh"):
                    b["capacity_wh"] = old["capacity_wh"]
                    b["eff_pct"] = old.get("eff_pct", b["eff_pct"])
                    b["source"] = old["source"]
            for i in data["inverters"]:
                old = by_inv.get(i["id"]) or {}
                if old.get("source") and old.get("eff_pct"):
                    i["eff_pct"] = old["eff_pct"]
                    if old.get("idle_w") is not None:
                        i["idle_w"] = old["idle_w"]
                    if old.get("mppt_pct") is not None:
                        i["mppt_pct"] = old["mppt_pct"]
                    i["source"] = old["source"]
            for p in data["panels"]:
                old = by_pan.get(p["id"]) or {}
                if old.get("source") and old.get("wp"):
                    p["wp"] = old["wp"]
                    p["eff_pct"] = old.get("eff_pct", p["eff_pct"])
                    p["source"] = old["source"]
            data["fetched_at"] = cached.get("fetched_at")
            data["fetch_log"] = cached.get("fetch_log") or []
        except (OSError, json.JSONDecodeError):
            pass
    if refresh or not data.get("fetched_at"):
        _apply_network(data)
        CACHE.parent.mkdir(parents=True, exist_ok=True)
        CACHE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    data.setdefault("fetch_log", [])
    return data
