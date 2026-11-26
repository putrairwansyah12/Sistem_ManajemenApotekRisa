"use client";

import { useCallback, useEffect, useMemo, useState, useId, useRef } from "react";
import Image from "next/image";
import { calculatePrice, getCalculatorHpp } from "../lib/pricing";
import { MIN_PASSWORD_LENGTH } from "../lib/user-validation";

const appStyles = `:root {
  color-scheme: light;
  --primary: #35118d;
  --primary-dark: #27106a;
  --lavender: #f3effb;
  --page: #f7f6fa;
  --ink: #241e35;
  --muted: #817c8c;
  --border: #ebe8f0;
  --green: #23845b;
  --orange: #bd6e18;
  --shadow: 0 8px 26px rgb(42 22 86 / 5%);
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--page); color: var(--ink); font-family: Arial, Helvetica, sans-serif; font-size: 14px; }
button, input, select { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .58; }

.app-shell { min-width: 0; min-height: 100vh; }
.sidebar { position: fixed; inset: 0 auto 0 0; z-index: 3; display: flex; width: 256px; flex-direction: column; overflow-y: auto; border-right: 3px solid #20d2f3; border-left: 3px solid #20d2f3; background: #30008f; padding: 23px 12px 16px; }
.brand { display: flex; align-items: center; gap: 11px; padding: 2px 8px 30px; color: inherit; text-decoration: none; }
.brand > span:last-child { display: grid; gap: 3px; }
.sidebar .brand b { color: #fff; font-size: 14px; letter-spacing: .3px; }
.sidebar .brand small { color: #c9b8f3; }
.brand small, .profile small { color: var(--muted); font-size: 11px; }
.brand-mark { display: grid; width: 42px; height: 42px; flex: 0 0 auto; place-items: center; border-radius: 14px; background: var(--primary); color: #fff; font-size: 21px; font-weight: 800; }
.brand-mark.small { width: 38px; height: 38px; border-radius: 12px; font-size: 18px; }
.nav-caption, .eyebrow { color: #9993a4; font-size: 10px; font-weight: 800; letter-spacing: 1.15px; }
.nav-caption { padding: 0 12px; margin: 0 0 10px; }
.sidebar .nav-caption { color: #bda9ef; font-size: 11px; letter-spacing: .8px; }
.sidebar nav { display: flex; flex-direction: column; gap: 28px; }
.nav-items { display: grid; gap: 7px; }
.nav-item { display: flex; width: 100%; min-height: 48px; align-items: center; gap: 13px; border: 0; border-radius: 13px; background: transparent; padding: 11px 14px; color: #ded4ff; font-size: 14px; font-weight: 600; text-align: left; transition: background .15s, color .15s; }
.nav-item:hover, .nav-item.selected { background: #5127a2; color: #fff; }
.nav-item.selected { font-weight: 700; }
.nav-icon { display: grid; width: 22px; flex: 0 0 22px; place-items: center; color: #c9b8f3; font-size: 18px; }
.nav-item:hover .nav-icon, .nav-item.selected .nav-icon { color: currentColor; }
.sidebar-note { display: flex; align-items: center; gap: 8px; margin-top: auto; border-top: 1px solid #6849ad; padding: 16px 7px 3px; color: #c9b8f3; font-size: 11px; }
.status-dot, .live-pill i { width: 8px; height: 8px; border-radius: 50%; background: #2ba273; }
.main-area { width: min(100% - 256px, 1600px); min-width: 0; min-height: 100vh; margin-left: 256px; padding: 0 34px 40px; }
.topbar { display: flex; min-height: 72px; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border); }
.topbar-start { display: flex; min-width: 0; align-items: center; gap: 10px; }
.menu-toggle { display: none; width: 40px; height: 40px; flex: 0 0 auto; align-items: center; justify-content: center; border: 1px solid var(--border); border-radius: 9px; background: #fff; color: var(--primary); font-size: 20px; }
.breadcrumb { min-width: 0; overflow: hidden; color: var(--muted); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.breadcrumb span { padding: 0 8px; color: #bab5c2; }
.profile { display: flex; flex: 0 0 auto; align-items: center; gap: 10px; }
.profile > div { display: grid; gap: 3px; }
.profile b { font-size: 12px; }
.avatar { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 50%; background: #eee8fa; color: var(--primary); font-weight: 800; }

.button { display: inline-flex; min-height: 39px; align-items: center; justify-content: center; gap: 9px; border: 0; border-radius: 8px; padding: 0 15px; font-weight: 700; transition: background .15s, transform .15s; }
.button:hover:not(:disabled) { transform: translateY(-1px); }
.button.primary { background: var(--primary); color: #fff; }
.button.primary:hover:not(:disabled) { background: var(--primary-dark); }
.button.secondary { min-height: 34px; background: var(--lavender); color: var(--primary); font-size: 12px; }
.button.ghost { border: 1px solid var(--border); background: #fff; color: var(--ink); }
.button.full { width: 100%; }
.icon-button { width: 39px; min-width: 39px; padding: 0; }
.icon-button.full { width: 100%; }
.icon { display: block; flex: 0 0 auto; }
.table-actions { display: flex; align-items: center; gap: 4px; }
.text-button.icon-button { display: inline-grid; width: 30px; min-width: 30px; height: 30px; min-height: 30px; place-items: center; border-radius: 7px; padding: 0; }
.password-toggle { width: 39px; min-width: 39px; }
.logout { min-height: 34px; margin-left: 8px; font-size: 11px; }
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 29px 0 22px; }
.page-heading > div { min-width: 0; }
.page-heading .live-pill { flex: 0 0 auto; }
.page-heading .eyebrow { margin: 0 0 8px; }
.page-heading h1 { margin: 0 0 6px; font-size: 26px; letter-spacing: -.5px; }
.inventory-tabs { display: flex; gap: 8px; margin-bottom: 16px; border-bottom: 1px solid var(--border); }
.inventory-tabs button { border: 0; border-bottom: 2px solid transparent; background: transparent; padding: 11px 14px; color: var(--muted); font-weight: 700; }
.inventory-tabs button.selected { border-bottom-color: var(--primary); color: var(--primary); }
.muted, .page-heading > div > p:last-child { color: var(--muted); }
.page-heading > div > p:last-child { margin: 0; }
.live-pill, .count-pill { display: inline-flex; align-items: center; gap: 7px; border: 1px solid #dcefe5; border-radius: 20px; background: #f5fbf7; padding: 7px 10px; color: var(--green); font-size: 10px; font-weight: 800; letter-spacing: .45px; white-space: nowrap; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 15px; margin-bottom: 17px; }
.metric-card, .panel { border: 1px solid var(--border); border-radius: 13px; background: #fff; box-shadow: var(--shadow); }
.metric-card { position: relative; width: 100%; min-height: 143px; padding: 18px; appearance: none; color: var(--ink); font: inherit; text-align: left; cursor: pointer; transition: transform .15s, border-color .15s; }
.metric-card:hover { transform: translateY(-2px); border-color: #cfc6e5; }
.metric-card:focus-visible { outline: 3px solid #9a84d1; outline-offset: 2px; }
.metric-card.selected { border-color: var(--primary); box-shadow: 0 0 0 2px rgb(53 17 141 / 12%); }
.metric-card > span { display: block; margin: 5px 0 8px; color: var(--muted); font-size: 12px; }
.metric-card strong { display: block; overflow: hidden; font-size: 24px; letter-spacing: -.6px; text-overflow: ellipsis; }
.metric-card small { display: block; margin-top: 6px; color: var(--muted); font-size: 11px; }
.metric-card .metric-card-action { color: var(--primary); font-weight: 700; }
.metric-icon { display: grid; width: 31px; height: 31px; place-items: center; border-radius: 9px; background: #f0ebfb; color: var(--primary); font-weight: 800; }
.metric-icon.warning { background: #fff4e8; color: var(--orange); }
.dashboard-grid { display: grid; grid-template-columns: minmax(0, 1.45fr) minmax(0, 1fr); gap: 15px; }
.panel { min-width: 0; margin-bottom: 16px; padding: 18px; }
.panel-title { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
.panel-title h2 { margin: 0 0 5px; font-size: 15px; }
.panel-title p { margin: 0; color: var(--muted); font-size: 11px; }
.count-pill { border-color: var(--border); background: #faf9fc; color: #716b7e; letter-spacing: 0; }
.attention-row, .picker-row, .cart-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid #f0edf3; padding: 13px 0; }
.attention-row:last-child, .picker-row:last-child, .cart-row:last-child { border-bottom: 0; }
.attention-row { justify-content: flex-start; }
.attention-icon { display: grid; width: 29px; height: 29px; flex: 0 0 auto; place-items: center; border-radius: 9px; background: #fff4e8; color: var(--orange); font-weight: 800; }
.attention-row div, .picker-row > div:first-child, .cart-row > div:first-child { display: grid; gap: 5px; }
.attention-row b, .picker-row b, .cart-row b { font-size: 12px; }
.attention-row small, .picker-row small, .cart-row small { color: var(--muted); font-size: 11px; }
.search-wrap { display: flex; align-items: center; gap: 8px; margin: 2px 0 13px; border: 1px solid var(--border); border-radius: 8px; padding: 0 11px; color: var(--muted); }
.search-wrap input { width: 100%; height: 38px; border: 0; outline: 0; background: transparent; color: var(--ink); font-size: 12px; }
.table-wrap { width: 100%; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; text-align: left; white-space: nowrap; }
th { background: #faf9fc; color: var(--muted); font-size: 10px; font-weight: 800; letter-spacing: .45px; }
th, td { border-bottom: 1px solid #f0edf3; padding: 12px 10px; }
tbody tr:last-child td { border-bottom: 0; }
td { color: #514c5d; font-size: 12px; }
td b { color: var(--ink); font-size: 12px; }
.cell-sub { display: block; margin-top: 4px; color: var(--muted); font-size: 10px; }
.badge { display: inline-block; border-radius: 20px; background: #eaf6ef; padding: 5px 9px; color: var(--green); font-size: 10px; font-weight: 700; }
.badge-warning { background: #fff2df; color: var(--orange); }
.empty-cell, .empty-state { padding: 29px 14px; color: var(--muted); text-align: center; }
.text-button { border: 0; background: transparent; color: #b33642; font-size: 11px; font-weight: 700; }
.form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; margin-bottom: 15px; }
.batch-count-list { display: grid; gap: 12px; margin-bottom: 15px; }
.batch-count-list .form-grid { align-items: end; border-bottom: 1px solid var(--border); margin-bottom: 0; padding-bottom: 12px; }
.sale-options { margin-top: 14px; }
.excel-import-form .panel-title p { max-width: 680px; line-height: 1.55; }
.excel-file-picker { position: relative; display: flex; width: min(100%, 720px); min-height: 78px; align-items: center; gap: 13px; border: 1px dashed #cfc4e5; border-radius: 12px; background: #fbfaff; padding: 13px 15px; cursor: pointer; transition: border-color .15s, background .15s; }
.excel-file-picker:hover { border-color: #9c87d0; background: #f7f3ff; }
.excel-file-picker:focus-within { outline: 3px solid #f0ebfb; border-color: #9c87d0; }
.excel-file-picker > input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.excel-file-icon { display: grid; width: 40px; height: 40px; flex: 0 0 auto; place-items: center; border-radius: 11px; background: #eee8fa; color: var(--primary); }
.excel-file-copy { display: grid; min-width: 0; flex: 1; gap: 5px; }
.excel-file-copy strong { overflow: hidden; color: var(--ink); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
.excel-file-copy small { color: var(--muted); font-size: 11px; }
.excel-file-trigger { flex: 0 0 auto; border: 1px solid #e4def0; border-radius: 8px; background: #fff; padding: 8px 11px; color: var(--primary); font-size: 11px; font-weight: 700; }
.excel-import-help { display: flex; align-items: flex-start; gap: 8px; margin: 12px 0; color: var(--muted); font-size: 11px; line-height: 1.5; }
.excel-import-help strong { color: #625c70; }
.excel-help-icon { display: grid; width: 16px; height: 16px; flex: 0 0 auto; place-items: center; border: 1px solid #d5cbea; border-radius: 50%; color: var(--primary); font-size: 10px; font-weight: 800; }
.excel-import-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.excel-import-actions small { color: var(--muted); font-size: 11px; }
.excel-preview { display: grid; gap: 12px; margin-top: 20px; border: 1px solid var(--border); border-radius: 12px; background: #fbfaff; padding: 16px; }
.excel-status { border-radius: 9px; padding: 10px 12px; font-size: 11px; line-height: 1.5; }
.excel-status.warning { background: #fff2df; color: var(--orange); }
.excel-status.success { background: #eaf6ef; color: var(--green); }
.excel-preview .panel-title, .excel-preview p { margin-bottom: 0; }
.excel-summary { display: flex; flex-wrap: wrap; gap: 8px; }
.excel-summary span { border: 1px solid var(--border); border-radius: 8px; background: #fff; padding: 7px 10px; color: #625c70; font-size: 11px; }
.excel-summary b { margin-left: 4px; color: var(--ink); }
.excel-summary span:nth-child(3) { border-color: #dcefe5; background: #f5fbf7; }
.excel-save-button { justify-self: start; }
.button.danger { background: #b33642; color: #fff; }
.button.danger:hover:not(:disabled) { background: #962d37; }
.restore-form .panel-title p { max-width: 720px; line-height: 1.55; }
.restore-warning { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 20px; border: 1px solid #f1d4d1; border-radius: 11px; background: #fff6f5; padding: 13px 15px; }
.restore-warning-icon { display: grid; width: 25px; height: 25px; flex: 0 0 auto; place-items: center; border-radius: 50%; background: #fbe2df; color: #a52e38; font-size: 13px; font-weight: 800; }
.restore-warning-copy { display: grid; gap: 4px; }
.restore-warning-copy strong { color: #8f2933; font-size: 12px; }
.restore-warning-copy small { color: #79575a; font-size: 11px; line-height: 1.5; }
.restore-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 18px; }
.restore-field { display: grid; align-content: start; gap: 9px; }
.restore-field-title { margin: 0; color: #625c70; font-size: 11px; font-weight: 800; }
.restore-file-picker { width: 100%; }
.restore-confirm-field { display: grid; gap: 8px; color: #625c70; font-size: 11px; font-weight: 700; }
.restore-confirm-field input { width: 100%; height: 48px; border: 1px solid var(--border); border-radius: 9px; outline: 0; background: #fff; padding: 0 12px; color: var(--ink); font-size: 13px; letter-spacing: .5px; }
.restore-confirm-field input:focus { border-color: #9c87d0; box-shadow: 0 0 0 3px #f2eefb; }
.restore-field-hint, .restore-file-error { color: var(--muted); font-size: 10px; line-height: 1.5; }
.restore-file-error { color: #a52e38; font-weight: 700; }
.restore-submit { min-width: 190px; }
.form-grid label, .login-card label { display: grid; gap: 7px; color: #625c70; font-size: 11px; font-weight: 700; }
.form-grid .password-field { display: grid; min-width: 0; gap: 7px; color: #625c70; font-size: 11px; font-weight: 700; }
.password-input { display: flex; min-width: 0; gap: 6px; }
.password-input input { flex: 1; }
.password-input .button { min-height: 39px; padding: 0 9px; font-size: 10px; white-space: nowrap; }
.user-form-actions { display: flex; flex-wrap: wrap; gap: 9px; }
.form-grid input, .form-grid select, .login-card input { width: 100%; min-width: 0; height: 39px; border: 1px solid var(--border); border-radius: 8px; outline: 0; background: #fff; padding: 0 10px; color: var(--ink); font-size: 12px; }
.form-grid input:focus, .form-grid select:focus, .login-card input:focus { border-color: #9c87d0; box-shadow: 0 0 0 3px #f2eefb; }
.sales-layout { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(300px, .8fr); gap: 15px; align-items: start; }
.sales-pagination { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-top: 1px solid var(--border); margin-top: 8px; padding-top: 13px; }
.sales-pagination > small { color: var(--muted); font-size: 11px; }
.sales-page-controls { display: flex; align-items: center; gap: 8px; }
.sales-page-controls .button { min-height: 32px; padding: 0 10px; font-size: 11px; }
.sales-page-number { min-width: 90px; color: #625c70; font-size: 11px; text-align: center; }
.picker-action { display: flex; align-items: center; gap: 13px; }
.picker-action > b { font-size: 11px; white-space: nowrap; }
.cart-panel { position: sticky; top: 16px; }
.cart-items { max-height: min(45vh, 380px); overflow-y: auto; overscroll-behavior: contain; padding-right: 4px; scrollbar-color: #b7a4e1 #f5f2fb; scrollbar-width: thin; }
.cart-items::-webkit-scrollbar { width: 8px; }
.cart-items::-webkit-scrollbar-track { border-radius: 8px; background: #f5f2fb; }
.cart-items::-webkit-scrollbar-thumb { border: 2px solid #f5f2fb; border-radius: 8px; background: #b7a4e1; }
.cart-row { padding: 14px 0; }
.quantity { display: flex; align-items: center; gap: 9px; }
.quantity button { display: grid; width: 27px; height: 27px; place-items: center; border: 1px solid var(--border); border-radius: 7px; background: #fff; color: var(--primary); }
.quantity span { min-width: 15px; text-align: center; font-size: 12px; }
.cart-total { display: flex; justify-content: space-between; border-top: 1px solid var(--border); margin: 13px 0; padding-top: 15px; color: var(--muted); font-size: 12px; }
.cart-total b { color: var(--ink); font-size: 16px; }
.price-result { display: grid; gap: 7px; margin-bottom: 15px; color: var(--muted); font-size: 12px; }
.price-result strong { color: var(--primary); font-size: 27px; }
.price-result b { color: var(--ink); }

.login-page { display: grid; min-height: 100vh; grid-template-columns: minmax(0, 1.08fr) minmax(370px, .92fr); background: #fff; }
.login-intro { display: flex; flex-direction: column; align-items: flex-start; justify-content: center; background: radial-gradient(ellipse at 10% 12%, #603cba 0, transparent 38%), linear-gradient(145deg, #300a8f, #44239b 75%, #5134a4); padding: 9vw 10vw; color: #fff; }
.login-intro .eyebrow { margin: 28px 0 9px; color: #c9b9f1; }
.login-intro h1 { margin: 0 0 12px; font-size: clamp(36px, 4vw, 55px); letter-spacing: -1.6px; }
.login-intro > p:not(.eyebrow) { max-width: 440px; margin: 0 0 30px; color: #e1d9f4; font-size: 15px; line-height: 1.7; }
.login-feature { display: flex; align-items: center; gap: 10px; margin: 7px 0; color: #eee9fa; font-size: 12px; }
.login-feature span { color: #a7e5c4; font-size: 16px; font-weight: 800; }
.login-card { align-self: center; justify-self: center; width: min(410px, 82%); }
.login-card .eyebrow { margin: 0 0 10px; color: var(--primary); }
.login-card h2 { margin: 0 0 7px; font-size: 25px; letter-spacing: -.5px; }
.login-card > p.muted { margin: 0 0 27px; font-size: 12px; }
.login-card label { margin-bottom: 15px; font-size: 12px; }
.login-card input { height: 44px; font-size: 13px; }
.login-card .button { min-height: 45px; margin-top: 7px; }
.login-card .button span { margin-left: auto; }
.login-password-input { display: flex; min-width: 0; gap: 8px; }
.login-password-input input { flex: 1; }
.login-password-input .button { width: 44px; min-width: 44px; margin: 0; padding: 0; }
.login-foot { margin-top: 17px; color: var(--muted); font-size: 10px; text-align: center; }
.loading, .loading-bar { color: var(--muted); text-align: center; }
.loading { display: grid; min-height: 100vh; place-items: center; }
.loading-bar { padding: 12px; font-size: 12px; }
.toast { position: fixed; right: 22px; bottom: 20px; z-index: 10; max-width: min(420px, calc(100vw - 32px)); border-radius: 9px; background: #21183a; padding: 13px 17px; color: #fff; box-shadow: var(--shadow); font-size: 12px; }
.sidebar-backdrop { display: none; }

.receipt-overlay { position: fixed; inset: 0; z-index: 30; display: grid; overflow-y: auto; place-items: start center; background: rgb(25 18 42 / 55%); padding: 24px; }
.receipt-dialog { width: min(100%, 560px); }
.receipt-actions { display: flex; justify-content: flex-end; gap: 8px; margin-bottom: 10px; }
.receipt-paper { width: min(100%, 440px); margin: 0 auto; border: 1px solid var(--border); background: #fff; padding: 24px; color: #171717; box-shadow: var(--shadow); font-family: "Courier New", Courier, monospace; font-size: 12px; line-height: 1.45; }
.receipt-paper::before, .receipt-header::after, .receipt-thanks::before, .receipt-thanks::after { display: block; color: #171717; text-align: center; white-space: nowrap; content: "=============================="; }
.receipt-paper::before { margin-bottom: 8px; }
.receipt-header { display: flex; align-items: center; flex-direction: column; padding-bottom: 8px; text-align: center; }
.receipt-header::after { margin-top: 8px; }
.receipt-header img { width: 60px; height: 60px; flex: 0 0 60px; object-fit: contain; }
.receipt-header-copy { min-width: 0; }
.receipt-header h2 { margin: 0 0 5px; font-size: 18px; letter-spacing: .4px; }
.receipt-header p { margin: 2px 0; line-height: 1.4; text-transform: uppercase; }
.receipt-header p:last-child { text-transform: none; }
.receipt-meta { display: grid; gap: 5px; border-bottom: 1px dashed #888; padding: 10px 0; }
.receipt-meta > div { display: grid; grid-template-columns: 17ch auto minmax(0, 1fr); align-items: baseline; column-gap: .5ch; }
.receipt-meta b { min-width: 0; text-align: left; overflow-wrap: anywhere; }
.receipt-item-price { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.receipt-lines { margin-top: 10px; border-bottom: 1px dashed #888; padding-bottom: 8px; }
.receipt-lines h3 { margin: 0 0 6px; font-size: 12px; font-weight: 400; }
.receipt-item { border-bottom: 1px solid #ddd; padding: 6px 0; }
.receipt-item:last-child { border-bottom: 0; }
.receipt-item-name { display: block; overflow-wrap: anywhere; text-transform: uppercase; }
.receipt-item-price { margin-top: 5px; font-size: 11px; }
.receipt-item-price span { min-width: 0; overflow-wrap: anywhere; }
.receipt-item-price b { flex: 0 0 auto; text-align: right; }
.receipt-summary { display: grid; grid-template-columns: 1fr auto; gap: 6px 12px; padding: 10px 0 0; }
.receipt-summary > :nth-child(even) { text-align: right; }
.receipt-total-divider { grid-column: 1 / -1; width: 100%; margin: 2px 0 0; border: 0; border-top: 1px dashed #888; }
.receipt-summary strong { padding-top: 2px; font-size: 14px; }
.receipt-thanks { margin: 10px 0 0; text-align: center; line-height: 1.45; }
.receipt-thanks::before { margin-bottom: 8px; }
.receipt-thanks::after { margin-top: 8px; }

@media print {
  @page { margin: 4mm; }
  body { background: #fff; }
  .app-shell, .receipt-actions { display: none !important; }
  .receipt-overlay { position: static; display: block; overflow: visible; background: #fff; padding: 0; }
  .receipt-dialog, .receipt-paper { width: 72mm; max-width: 72mm; margin: 0; border: 0; box-shadow: none; padding: 0; }
  .receipt-paper { font-size: 9px; }
  .receipt-header img { width: 48px; height: 48px; flex-basis: 48px; }
  .receipt-header h2 { font-size: 10px; }
  .receipt-header p { font-size: 7px; }
  .receipt-lines h3, .receipt-item-name { font-size: 9px; }
  .receipt-item-price { font-size: 8px; }
  .receipt-summary { gap: 5px 8px; }
  .receipt-summary strong { font-size: 10px; }
  .receipt-thanks { font-size: 8px; }
}

@media (max-width: 1100px) {
  .main-area { width: calc(100% - 230px); margin-left: 230px; padding-right: 22px; padding-left: 22px; }
  .sidebar { width: 230px; }
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .report-metrics { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 850px) {
  .sidebar { position: fixed; inset: 0 auto 0 0; z-index: 12; width: min(280px, calc(100vw - 52px)); height: 100vh; height: 100dvh; border-right: 1px solid var(--border); border-bottom: 0; padding: 23px 15px 16px; box-shadow: 12px 0 32px rgb(30 20 55 / 12%); transform: translateX(-105%); transition: transform .22s ease; }
  .sidebar.mobile-open { transform: translateX(0); }
  .sidebar nav { overflow-y: auto; }
  .nav-item { min-height: 44px; }
  .sidebar-backdrop { position: fixed; inset: 0; z-index: 11; display: block; border: 0; background: rgb(25 18 42 / 42%); }
  .menu-toggle { display: inline-flex; }
  .main-area { width: 100%; margin: 0; padding: 0 15px 28px; }
  .topbar { min-height: 59px; }
  .topbar-start { gap: 8px; }
  .breadcrumb { font-size: 10px; }
  .profile { gap: 7px; }
  .logout { margin-left: 0; }
  .page-heading { align-items: flex-start; padding: 21px 0 16px; }
  .page-heading h1 { font-size: 23px; }
  .live-pill { margin-top: 6px; font-size: 8px; }
  .metric-grid { gap: 9px; }
  .metric-card { min-height: 130px; padding: 13px; }
  .metric-card strong { font-size: 20px; }
  .dashboard-grid, .sales-layout { grid-template-columns: 1fr; gap: 0; }
  .panel { padding: 14px; }
  .cart-panel { position: static; }
  .cart-items { max-height: min(42vh, 320px); }
  .form-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 11px; }
  .login-page { grid-template-columns: 1fr; }
  .login-intro { min-height: 280px; padding: 35px 27px; }
  .login-intro .eyebrow { margin-top: 19px; }
  .login-intro h1 { font-size: 37px; }
  .login-intro > p:not(.eyebrow) { margin-bottom: 15px; font-size: 13px; }
  .login-feature { margin: 4px 0; }
  .login-card { width: min(430px, calc(100% - 48px)); padding: 35px 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar { transition: none; }
}

@media (max-width: 600px) {
  .profile > div { display: none; }
  .topbar { gap: 8px; }
  .page-heading { gap: 10px; }
  .page-heading h1 { overflow-wrap: anywhere; }
  .report-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sales-pagination { align-items: flex-start; flex-direction: column; }
  .restore-grid { grid-template-columns: 1fr; gap: 15px; }
  .restore-submit { width: 100%; }
  .excel-file-picker { min-height: 70px; gap: 9px; padding: 11px; }
  .excel-file-icon { width: 35px; height: 35px; }
  .excel-file-trigger { padding: 7px 8px; }
  .excel-preview { padding: 12px; }
}

@media (max-width: 420px) {
  .form-grid { grid-template-columns: 1fr; }
  .page-heading { display: block; }
  .live-pill { display: inline-flex; }
  .picker-row { align-items: flex-start; }
  .picker-action { align-items: flex-end; flex-direction: column; gap: 6px; }
  .login-intro { padding-right: 22px; padding-left: 22px; }
  .login-card { width: calc(100% - 36px); }
  .report-metrics { grid-template-columns: 1fr; }
}

.report-metrics { grid-template-columns: repeat(5, minmax(0, 1fr)); }
`;

function AppStyles() {
  return <style jsx global>{appStyles}</style>;
}

const SALES_PAGE_SIZE = 25;

const menus = [
  ["dashboard", "Ringkasan", "▦"],
  ["products", "Obat & Persediaan", "▤"],
  ["calculator", "Kalkulator Harga", "∑", "PEMILIK"],
  ["prices", "Riwayat Harga", "◴", "PEMILIK"],
  ["sales", "Transaksi Penjualan", "＋"],
  ["history", "Riwayat Penjualan", "◴"],
  ["expenses", "Biaya Operasional", "−", "PEMILIK"],
  ["reports", "Laporan", "▥", "PEMILIK"],
  ["excel", "Impor/Ekspor Excel", "▧", "PEMILIK"],
  ["stock", "Stock Opname", "▥", "PEMILIK"],
  ["backup", "Backup & Restore", "⬇", "PEMILIK"],
  ["users", "Pengguna", "♙", "PEMILIK"],
];

const menuSections = [
  { title: "MENU UTAMA", ids: ["dashboard", "products", "sales", "history"] },
  { title: "MANAJEMEN & SISTEM", ids: ["calculator", "prices", "expenses", "reports", "excel", "stock", "backup", "users"] },
];

const reportMetricLabels = {
  omzet: "Omzet",
  jumlahKunjungan: "Jumlah kunjungan",
  labaKotor: "Laba kotor",
  biayaOperasional: "Biaya operasional",
  labaBersih: "Laba bersih",
};

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});
const receiptNumber = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 });

function money(value) {
  return currency.format(Number(value || 0));
}

function dateInputValue(value = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function date(value) {
  return value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

async function downloadFile(url, filename, fallbackMessage) {
  const response = await fetch(url);
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.error || fallbackMessage);
  }
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

async function request(url, options) {
  const isFormData = typeof FormData !== "undefined" && options?.body instanceof FormData;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options?.body && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || result.message || "Permintaan gagal.");
    error.payload = result;
    throw error;
  }
  return result;
}

function Icon({ name, size = 18 }) {
  const paths = {
    login: <><path d="M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h6" /><path d="m15 16 4-4-4-4" /><path d="M19 12H8" /></>,
    logout: <><path d="M14 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6" /><path d="m9 16-4-4 4-4" /><path d="M5 12h12" /></>,
    save: <><path d="M5 3h12l4 4v14H3V3h2Z" /><path d="M7 3v6h9V3" /><path d="M7 21v-8h10v8" /></>,
    cancel: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    minus: <path d="M5 12h14" />,
    trash: <><path d="M3 6h18" /><path d="M8 6V3h8v3" /><path d="m19 6-1 15H6L5 6" /><path d="M10 10v7" /><path d="M14 10v7" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    archive: <><path d="M3 4h18v4H3z" /><path d="M5 8v12h14V8" /><path d="M9 12h6" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 6.1A11.8 11.8 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-2.1 2.8" /><path d="M6.2 8.2A16 16 0 0 0 2 12s3.5 6 10 6a9.5 9.5 0 0 0 3.1-.5" /></>,
    download: <><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 21h14" /></>,
    preview: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><path d="M12 9v6" /><path d="M9 12h6" /></>,
    password: <><rect x="3" y="10" width="18" height="11" rx="2" /><path d="M7 10V7a5 5 0 0 1 10 0v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    restore: <><path d="M4 4v6h6" /><path d="M5.5 15a8 8 0 1 0 2-8.5L4 10" /></>,
    report: <><path d="M4 3h16v18H4z" /><path d="M8 17v-4" /><path d="M12 17V7" /><path d="M16 17v-6" /></>,
    cart: <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M3 4h2l2.5 11h11l2-8H6" /></>,
    price: <><path d="M20 12 12 20l-8-8V4h8Z" /><circle cx="8" cy="8" r="1" /></>,
    print: <><path d="M6 9V3h12v6" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /><path d="M18 12h.01" /></>,
  };
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

export default function Home() {
  const [user, setUser] = useState(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [screen, setScreen] = useState("dashboard");
  const [summaryDetail, setSummaryDetail] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [data, setData] = useState([]);
  const [stockProducts, setStockProducts] = useState([]);
  const [stockProductId, setStockProductId] = useState("");
  const [stockBatchItems, setStockBatchItems] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [report, setReport] = useState(null);
  const [reportDetail, setReportDetail] = useState(null);
  const [reportFilter, setReportFilter] = useState({ period: "month", date: "" });
  const [expenseDate, setExpenseDate] = useState("");
  const [excelFile, setExcelFile] = useState(null);
  const [excelPreview, setExcelPreview] = useState(null);
  const [backupFile, setBackupFile] = useState(null);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [query, setQuery] = useState("");
  const [salesPage, setSalesPage] = useState(1);
  const [cart, setCart] = useState([]);
  const [saleSettings, setSaleSettings] = useState({
    jenis: "OFFLINE",
    potongan: "0",
    persenBiayaAdmin: "0",
    persenPajak: "0",
    biayaPengemasan: "0",
    biayaLayanan: "0",
    biayaGratisOngkir: "0",
  });
  const [priceForm, setPriceForm] = useState({
    produkId: "",
    hpp: "",
    hppSumber: "hpp",
    persenBiayaAdmin: "0",
    persenPajak: "0",
    biayaPengemasan: "0",
    biayaLayanan: "0",
    biayaGratisOngkir: "0",
    persenTargetLaba: "0",
  });
  const [priceResult, setPriceResult] = useState(null);
  const [priceDraft, setPriceDraft] = useState(null);
  const [priceError, setPriceError] = useState("");
  const [editingProduct, setEditingProduct] = useState(null);
  const editProductFormRef = useRef(null);
  const [receiptSale, setReceiptSale] = useState(null);
  const [userEditor, setUserEditor] = useState(null);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditorPassword, setShowEditorPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!mobileNavOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileNavOpen]);

  useEffect(() => {
    if (editingProduct) {
      editProductFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [editingProduct]);

  function recalculatePrice(nextForm) {
    if (!nextForm.produkId) {
      setPriceDraft(null);
      setPriceResult(null);
      setPriceError("");
      return;
    }
    const draft = {
      ...nextForm,
      produkId: Number(nextForm.produkId),
      simpanHpp: nextForm.hppSumber !== "hargaBeli",
    };
    try {
      const calculation = calculatePrice(draft);
      setPriceDraft(draft);
      setPriceResult(calculation);
      setPriceError("");
    } catch (error) {
      setPriceDraft(null);
      setPriceResult(null);
      setPriceError(error instanceof Error ? error.message : "Input kalkulasi tidak valid.");
    }
  }

  const flash = useCallback((message) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 3500);
  }, []);

  const loadScreen = useCallback(async (currentScreen) => {
    setLoading(true);
    setData([]);
    setStockProducts([]);
    setStockProductId("");
    setStockBatchItems([]);
    try {
      if (currentScreen === "dashboard") {
        setDashboard(await request("/api/dashboard"));
      } else if (currentScreen === "products") {
        setData((await request("/api/products")).products);
      } else if (currentScreen === "calculator") {
        setData((await request("/api/products")).products);
      } else if (currentScreen === "history") {
        setData((await request("/api/sales")).sales);
      } else if (currentScreen === "expenses") {
        setExpenseDate(dateInputValue());
        setData((await request("/api/expenses")).expenses);
      } else if (currentScreen === "reports") {
        const date = dateInputValue();
        setReportFilter({ period: "month", date });
        setReport(await request(`/api/reports?period=month&date=${date}`));
        setReportDetail(null);
      } else if (currentScreen === "prices") {
        setData((await request("/api/price-history")).history);
      } else if (currentScreen === "stock") {
        const stockData = await request("/api/stock-opname");
        setData(stockData.records);
        setStockProducts(stockData.products);
        setStockProductId("");
        setStockBatchItems([]);
      } else if (currentScreen === "expiry") {
        const [expiryData, productData] = await Promise.all([
          request("/api/expiry"),
          request("/api/products"),
        ]);
        setData(expiryData.batches);
        setStockProducts(productData.products);
      } else if (currentScreen === "users") {
        setData((await request("/api/users")).users);
      } else if (currentScreen === "sales") {
        setSalesPage(1);
        setData((await request("/api/products?untukPenjualan=true")).products);
      }
    } catch (error) {
      flash(error.message);
    } finally {
      setLoading(false);
    }
  }, [flash]);

  useEffect(() => {
    request("/api/auth/session")
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        return loadScreen("dashboard");
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [loadScreen]);

  const filtered = useMemo(() => {
    let result = data;
    if (screen === "products" && summaryDetail === "lowStock") {
      result = result.filter((item) => item.stok <= item.stokMinimum);
    } else if (screen === "history" && summaryDetail === "todayRevenue") {
      const today = dateInputValue();
      result = result.filter((item) => dateInputValue(new Date(item.tanggal)) === today);
    } else if (screen === "expiry" && summaryDetail === "expiring") {
      result = result.filter((item) => item.status !== "KEDALUWARSA");
    }

    const term = query.trim().toLocaleLowerCase("id-ID");
    if (!term) return result;
    return result.filter((item) =>
      JSON.stringify(item).toLocaleLowerCase("id-ID").includes(term),
    );
  }, [data, query, screen, summaryDetail]);

  const salesPageCount = Math.max(1, Math.ceil(filtered.length / SALES_PAGE_SIZE));
  const activeSalesPage = Math.min(salesPage, salesPageCount);
  const salesPageStart = (activeSalesPage - 1) * SALES_PAGE_SIZE;
  const salesPageProducts = filtered.slice(salesPageStart, salesPageStart + SALES_PAGE_SIZE);

  function openSummaryDetail(detail) {
    const targetScreen = detail === "todayRevenue"
      ? "history"
      : detail === "expiring"
        ? "expiry"
        : "products";
    setSummaryDetail(detail);
    setQuery("");
    setScreen(targetScreen);
    setMobileNavOpen(false);
    loadScreen(targetScreen);
  }

  function selectInventoryTab(tab) {
    setSummaryDetail(null);
    setQuery("");
    setScreen(tab);
    setMobileNavOpen(false);
    loadScreen(tab);
  }

  async function login(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const { user: currentUser } = await request("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      setUser(currentUser);
      setSummaryDetail(null);
      setScreen("dashboard");
      await loadScreen("dashboard");
      flash(`Selamat datang, ${currentUser.nama}.`);
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await request("/api/auth/logout", { method: "POST" });
      setUser(null);
      setData([]);
      setCart([]);
      setDashboard(null);
    } catch (error) {
      flash(error.message);
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      await request("/api/products", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      form.reset();
      flash("Obat berhasil ditambahkan.");
      await loadScreen("products");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveStocktake(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!stockProductId || !stockBatchItems.length) {
      flash("Pilih obat dan cantumkan setidaknya satu batch fisik.");
      return;
    }
    setBusy(true);
    try {
      await request("/api/stock-opname", {
        method: "POST",
        body: JSON.stringify({
          produkId: stockProductId,
          alasan: new FormData(form).get("alasan"),
          items: stockBatchItems,
        }),
      });
      form.reset();
      setStockProductId("");
      setStockBatchItems([]);
      flash("Stock opname tersimpan dan stok diperbarui.");
      await loadScreen("stock");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function receiveBatch(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      try {
        await request("/api/expiry", { method: "POST", body: JSON.stringify(body) });
      } catch (error) {
        if (error.payload?.code !== "BATCH_EXPIRY_OVERLAP") throw error;
        const detail = error.payload.overlaps.map((batch) => `${batch.nomorBatch} (${batch.jumlah} unit)`).join(", ");
        if (!window.confirm(`${error.message}\nBatch terkait: ${detail}\nLanjutkan penerimaan?`)) return;
        await request("/api/expiry", {
          method: "POST",
          body: JSON.stringify({ ...body, konfirmasiOverlap: true }),
        });
      }
      form.reset();
      flash("Batch diterima dan stok bertambah.");
      await loadScreen("expiry");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createUser(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusy(true);
    try {
      await request("/api/users", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      form.reset();
      setShowCreatePassword(false);
      flash("Pengguna berhasil dibuat.");
      await loadScreen("users");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function createExpense(event) {
      event.preventDefault();
      const form = event.currentTarget;
      setBusy(true);
      try {
        await request("/api/expenses", {
          method: "POST",
          body: JSON.stringify(Object.fromEntries(new FormData(form))),
        });
        form.reset();
        flash("Biaya operasional berhasil dicatat.");
        await loadScreen("expenses");
      } catch (error) {
        flash(error.message);
      } finally {
        setBusy(false);
      }
  }

  async function deleteExpense(expense) {
      if (!window.confirm(`Hapus biaya "${expense.deskripsi}"?`)) return;
      try {
        await request(`/api/expenses/${expense.id}`, { method: "DELETE" });
        flash("Biaya operasional berhasil dihapus.");
        await loadScreen("expenses");
      } catch (error) {
        flash(error.message);
      }
  }

  async function archiveSale(sale) {
    if (!window.confirm(`Sembunyikan transaksi ${sale.kodeTransaksi} dari riwayat? Transaksi tetap memengaruhi stok dan laporan.`)) return;
    setBusy(true);
    try {
      await request(`/api/sales/${sale.id}`, { method: "DELETE" });
      flash("Transaksi disembunyikan dari riwayat. Stok dan laporan tidak berubah.");
      await loadScreen("history");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function refreshReport(event) {
      event.preventDefault();
      setBusy(true);
      try {
        const params = new URLSearchParams(reportFilter);
        setReport(await request(`/api/reports?${params}`));
        setReportDetail(null);
      } catch (error) {
        flash(error.message);
      } finally {
        setBusy(false);
      }
  }

  async function downloadBackup() {
      setBusy(true);
      try {
        await downloadFile("/api/backup", `apotekrisa-backup-${dateInputValue()}.json`, "Unduhan backup gagal.");
        flash("Backup berhasil diunduh. Simpan file dengan aman.");
      } catch (error) {
        flash(error.message);
      } finally {
        setBusy(false);
      }
  }

  async function restoreBackup(event) {
      event.preventDefault();
      if (!backupFile || backupFile.size > 25 * 1024 * 1024) {
        flash("Pilih file backup JSON dengan ukuran maksimal 25 MB.");
        return;
      }
      if (restoreConfirmation !== "RESTORE") {
        flash("Ketik RESTORE untuk mengonfirmasi penggantian seluruh data.");
        return;
      }
      if (!window.confirm("Restore akan mengganti seluruh data saat ini. Pastikan Anda memiliki backup terbaru. Lanjutkan?")) return;
      setBusy(true);
      try {
        let backup;
        try {
          backup = JSON.parse(await backupFile.text());
        } catch {
          throw new Error("File backup bukan JSON yang valid.");
        }
        await request("/api/backup", {
          method: "POST",
          body: JSON.stringify({ ...backup, confirmation: "RESTORE" }),
        });
        await request("/api/auth/logout", { method: "POST" });
        setUser(null);
        setData([]);
        setCart([]);
        setBackupFile(null);
        setRestoreConfirmation("");
        flash("Restore berhasil. Silakan masuk kembali.");
      } catch (error) {
        flash(error.message);
      } finally {
        setBusy(false);
    }
  }

  async function exportProductsExcel() {
    setBusy(true);
    try {
      await downloadFile("/api/products/export", "produk.xlsx", "Ekspor produk gagal.");
      flash("Ekspor produk berhasil diunduh.");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function previewProductsExcel(event) {
    event.preventDefault();
    if (!excelFile || excelFile.size > 5 * 1024 * 1024) {
      flash("Pilih file .xlsx dengan ukuran maksimal 5 MB.");
      return;
    }
    const formData = new FormData();
    formData.set("file", excelFile);
    formData.set("mode", "preview");
    setBusy(true);
    try {
      setExcelPreview(await request("/api/products/import", { method: "POST", body: formData }));
    } catch (error) {
      if (error.payload?.rows) setExcelPreview(error.payload);
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function commitProductsExcel() {
    if (!excelFile || !excelPreview || excelPreview.counts?.errors) return;
    const formData = new FormData();
    formData.set("file", excelFile);
    formData.set("mode", "commit");
    setBusy(true);
    try {
      const result = await request("/api/products/import", { method: "POST", body: formData });
      setExcelPreview(result);
      setExcelFile(null);
      flash(`${result.counts.create} produk ditambahkan dan ${result.counts.update} produk diperbarui.`);
    } catch (error) {
      if (error.payload?.rows) setExcelPreview(error.payload);
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveProductEdit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);
      if (Number(formData.get("stok")) === editingProduct.stok) {
        formData.delete("stok");
        formData.delete("alasanStok");
      }
      setBusy(true);
      try {
        await request(`/api/products/${editingProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify(Object.fromEntries(formData)),
        });
        setEditingProduct(null);
        flash("Perubahan produk berhasil disimpan.");
        await loadScreen("products");
      } catch (error) {
        flash(error.message);
      } finally {
        setBusy(false);
  }
    }

  async function saveSuggestedPrice() {
      if (!priceDraft) return;
      setBusy(true);
      try {
        await request("/api/pricing", {
          method: "POST",
          body: JSON.stringify({ ...priceDraft, simpan: true }),
        });
        setPriceResult(null);
        setPriceDraft(null);
        setPriceError("");
        flash("Kalkulasi disimpan dan harga jual produk diperbarui.");
        await loadScreen("calculator");
      } catch (error) {
        flash(error.message);
      } finally {
        setBusy(false);
  }
    }

  function changePriceInput(event) {
      const { name, value } = event.target;
      let nextForm;
      if (name === "hpp") {
        nextForm = { ...priceForm, hpp: value, hppSumber: "manual" };
      } else if (name === "produkId") {
        const product = data.find((item) => item.id === Number(value));
        const cost = getCalculatorHpp(product);
        nextForm = { ...priceForm, produkId: value, hpp: String(cost.value), hppSumber: cost.source };
      } else {
        nextForm = { ...priceForm, [name]: value };
      }
      setPriceForm(nextForm);
      recalculatePrice(nextForm);
  }

  function openCashierEditor(cashier, mode) {
    setUserEditor({ id: cashier.id, mode, nama: cashier.nama, username: cashier.username });
    setShowEditorPassword(false);
  }

  async function saveCashier(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    const body = userEditor.mode === "edit"
      ? { nama: values.nama, username: values.username }
      : userEditor.mode === "owner-name"
        ? { nama: values.nama }
        : { password: values.password };
    setBusy(true);
    try {
      await request(`/api/users/${userEditor.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      if (userEditor.mode === "owner-name") setUser((current) => ({ ...current, nama: values.nama.trim() }));
      setUserEditor(null);
      setShowEditorPassword(false);
      const message = userEditor.mode === "edit"
        ? "Data pengguna diperbarui."
        : userEditor.mode === "owner-name"
          ? "Nama pemilik diperbarui."
          : "Kata sandi pengguna diperbarui.";
      flash(message);
      await loadScreen("users");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleCashier(cashier) {
      const aktif = !cashier.aktif;
      const message = aktif ? "Aktifkan kembali akun ini?" : "Nonaktifkan akun ini?";
      if (!window.confirm(message)) return;
      try {
        await request(`/api/users/${cashier.id}`, {
          method: "PATCH",
          body: JSON.stringify({ aktif }),
        });
        flash(aktif ? "Akun kasir diaktifkan." : "Akun kasir diarsipkan.");
        await loadScreen("users");
      } catch (error) {
        flash(error.message);
    }
  }

  async function deleteCashier(cashier) {
    if (!window.confirm(`Hapus permanen akun ${cashier.nama}? Akun dengan riwayat aktivitas hanya dapat diarsipkan.`)) return;
    try {
      await request(`/api/users/${cashier.id}`, { method: "DELETE" });
      flash("Akun pengguna berhasil dihapus.");
      await loadScreen("users");
    } catch (error) {
      flash(error.message);
    }
  }

  async function checkout() {
    setBusy(true);
    try {
      const { sale } = await request("/api/sales", {
        method: "POST",
        body: JSON.stringify({
          ...saleSettings,
          items: cart.map(({ id, quantity }) => ({ produkId: id, jumlah: quantity })),
        }),
      });
      setReceiptSale(sale);
      setCart([]);
      setSaleSettings({
        jenis: "OFFLINE",
        potongan: "0",
        persenBiayaAdmin: "0",
        persenPajak: "0",
        biayaPengemasan: "0",
        biayaLayanan: "0",
        biayaGratisOngkir: "0",
      });
      flash("Transaksi berhasil. Stok sudah diperbarui.");
      setScreen("history");
      await loadScreen("history");
    } catch (error) {
      flash(error.message);
    } finally {
      setBusy(false);
    }
  }

  function changeSaleSetting(event) {
    const { name, value } = event.target;
    setSaleSettings((current) => ({ ...current, [name]: value }));
  }

  async function archiveProduct(productId) {
    if (!window.confirm("Arsipkan obat ini? Obat tidak akan bisa dipilih untuk transaksi baru.")) return;
    try {
      await request(`/api/products/${productId}`, { method: "DELETE" });
      flash("Obat berhasil diarsipkan.");
      await loadScreen("products");
    } catch (error) {
      flash(error.message);
    }
  }

  async function changePrice(product) {
    const value = window.prompt(`Harga jual baru untuk ${product.namaProduk}:`, String(product.hargaJual));
    if (value === null) return;
    const hargaJual = Number(value);
    if (!Number.isFinite(hargaJual) || hargaJual < 0) {
      flash("Masukkan harga jual berupa angka nol atau lebih.");
      return;
    }
    try {
      await request(`/api/products/${product.id}`, {
        method: "PATCH",
        body: JSON.stringify({ hargaJual }),
      });
      flash("Harga diperbarui dan dicatat ke riwayat.");
      await loadScreen("products");
    } catch (error) {
      flash(error.message);
    }
  }

  if (loading && !user) return <><AppStyles /><main className="loading">Memuat Apotek Risa…</main></>;

  if (!user) {
    return (
      <>
      <AppStyles />
      <main className="login-page">
        <section className="login-intro">
          <div className="brand-mark">
            <img src="/apotek.jpg" alt="Logo Apotek Risa" width="48" height="48" />
          </div>
          <p className="eyebrow">SISTEM INFORMASI MANAJEMEN</p>
          <h1>Apotek Risa</h1>
          <p>Persediaan obat, transaksi, dan laporan dalam satu tempat.</p>
          <div className="login-feature"><span>✓</span> Data tersimpan langsung ke database</div>
          <div className="login-feature"><span>✓</span> Hak akses pemilik dan kasir</div>
        </section>
        <form className="login-card" onSubmit={login}>
          <p className="eyebrow">SELAMAT DATANG</p>
          <h2>Masuk ke akun Anda</h2>
          <p className="muted">Gunakan akun yang sudah didaftarkan pemilik.</p>
          <label>Username<input name="username" autoComplete="username" required /></label>
          <label>Password
            <span className="login-password-input">
              <input name="password" type={showLoginPassword ? "text" : "password"} autoComplete="current-password" required />
              <button type="button" className="button ghost icon-button" aria-label={showLoginPassword ? "Sembunyikan password" : "Lihat password"} title={showLoginPassword ? "Sembunyikan password" : "Lihat password"} aria-pressed={showLoginPassword} onClick={() => setShowLoginPassword((visible) => !visible)}>
                <Icon name={showLoginPassword ? "eyeOff" : "eye"} />
              </button>
            </span>
          </label>
          <button className="button primary full" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
          <p className="login-foot">Akses hanya untuk pengguna Apotek Risa.</p>
        </form>
        {notice && <div className="toast">{notice}</div>}
      </main>
      </>
    );
  }

  const activeMenu = menus.find(([id]) => id === screen)
    || (screen === "expiry" ? menus.find(([id]) => id === "products") : null);
  const visibleMenus = menus.filter(([, , , role]) => !role || role === user.role);
  const visibleMenuSections = menuSections.map(({ title, ids }) => ({
    title,
    menus: visibleMenus.filter(([id]) => ids.includes(id)),
  })).filter(({ menus: sectionMenus }) => sectionMenus.length > 0);
  const summaryDetailTitles = {
    todayRevenue: "Omzet hari ini",
    activeProducts: "Produk aktif",
    lowStock: "Stok menipis",
    expiring: "Kedaluwarsa ≤ 6 bulan",
  };
  const heading = summaryDetailTitles[summaryDetail]
    || (screen === "expiry" ? "Kedaluwarsa" : activeMenu?.[1] || "Ringkasan");
  const selectedPriceProduct = data.find((item) => item.id === Number(priceForm.produkId));
  const priceSourceNote = priceForm.hppSumber === "hargaBeli"
    ? "HPP produk masih 0; kalkulasi memakai harga beli database. HPP database tidak diubah saat simpan."
    : priceForm.hppSumber === "manual"
      ? "HPP yang dimasukkan manual akan disimpan ke produk."
      : "HPP diambil dari database.";

  return (
    <>
    <AppStyles />
    <div className="app-shell">
      {mobileNavOpen && <button className="sidebar-backdrop" type="button" aria-label="Tutup menu navigasi" onClick={() => setMobileNavOpen(false)} />}
      <aside id="main-sidebar" className={`sidebar ${mobileNavOpen ? "mobile-open" : ""}`}>
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setMobileNavOpen(false); setSummaryDetail(null); setScreen("dashboard"); }}>
          <span className="brand-mark small">
            <img src="/apotek.jpg" alt="Logo Apotek Risa" width="32" height="32" />  
          </span><span><b>APOTEK RISA</b><small>Management System</small></span>
        </a>
        <nav className="sidebar-nav" aria-label="Navigasi utama">
          {visibleMenuSections.map(({ title, menus: sectionMenus }) => <div className="nav-group" key={title}>
            <p className="nav-caption">{title}</p>
            <div className="nav-items">{sectionMenus.map(([id, itemTitle, icon]) => (
              <button key={id} className={`nav-item ${screen === id || (id === "products" && screen === "expiry") ? "selected" : ""}`} aria-label={itemTitle} title={itemTitle} onClick={() => { setSummaryDetail(null); setReportDetail(null); setQuery(""); setScreen(id); setMobileNavOpen(false); loadScreen(id); }}>
                <span className="nav-icon" aria-hidden="true">{icon}</span>{itemTitle}
              </button>
            ))}</div>
          </div>)}
        </nav>
        <div className="sidebar-note"><span className="status-dot" /> Database terhubung melalui server</div>
      </aside>
      <main className="main-area">
        <header className="topbar"><div className="topbar-start"><button className="menu-toggle" type="button" aria-label={mobileNavOpen ? "Tutup menu navigasi" : "Buka menu navigasi"} aria-controls="main-sidebar" aria-expanded={mobileNavOpen} onClick={() => setMobileNavOpen((open) => !open)}><span aria-hidden="true">{mobileNavOpen ? "×" : "☰"}</span></button><div className="breadcrumb">Apotek Risa <span>/</span> {heading}</div></div><div className="profile"><span className="avatar">{user.nama.slice(0, 1).toUpperCase()}</span><div><b>{user.nama}</b><small>{user.role === "PEMILIK" ? "Pemilik Apotek" : "Kasir"}</small></div><button className="button ghost logout icon-button" onClick={logout} aria-label="Keluar" title="Keluar"><Icon name="logout" /></button></div></header>
        <section className="page-heading"><div><p className="eyebrow">APOTEK RISA / OPERASIONAL</p><h1>{heading}</h1><p className="muted">{summaryDetail ? "Detail data dari ringkasan." : screen === "dashboard" ? "Pantau aktivitas dan kondisi persediaan apotek." : `Kelola ${heading.toLocaleLowerCase("id-ID")} dengan data dari database.`}</p></div><span className="live-pill"><i /> DATA LANGSUNG</span></section>

        {screen === "dashboard" && <Dashboard dashboard={dashboard} money={money} date={date} onMetricClick={openSummaryDetail} />}
        {screen === "products" && <>
          <InventoryTabs activeTab="products" onSelect={selectInventoryTab} />
          {user.role === "PEMILIK" && !summaryDetail && <form className="panel product-form" onSubmit={createProduct}>
            <div className="panel-title"><div><h2>Tambah obat</h2><p>Masukkan detail produk dan persediaan awal.</p></div></div>
            <div className="form-grid">
              <Field name="namaProduk" label="Nama obat" required />
              <Field name="kodeBarang" label="Kode barang" />
              <Field name="kategori" label="Kategori" required />
              <Field name="satuan" label="Satuan" required placeholder="Contoh: Strip" />
              <Field name="hargaBeli" label="Harga beli / HPP" type="number" min="0" required />
              <Field name="hargaJual" label="Harga jual" type="number" min="0" required />
              <Field name="stok" label="Stok awal" type="number" min="0" required />
              <Field name="stokMinimum" label="Batas stok menipis" type="number" min="0" required />
            </div><button className="button primary icon-button" disabled={busy} aria-label="Simpan obat" title="Simpan obat"><Icon name="save" /></button>
          </form>}
          {editingProduct && !summaryDetail && <form ref={editProductFormRef} className="panel product-form" onSubmit={saveProductEdit}>
            <div className="panel-title"><div><h2>Ubah produk</h2><p>{editingProduct.namaProduk}</p></div></div>
            <div className="form-grid">
              <Field name="namaProduk" label="Nama obat" defaultValue={editingProduct.namaProduk} required />
              <Field name="kodeBarang" label="Kode barang" defaultValue={editingProduct.kodeBarang || ""} />
              <Field name="kategori" label="Kategori" defaultValue={editingProduct.kategori.nama} required />
              <Field name="satuan" label="Satuan" defaultValue={editingProduct.satuan.kode} required />
              <Field name="hargaBeli" label="Harga beli" type="number" min="0" step="0.01" defaultValue={editingProduct.hargaBeli} required />
              <Field name="hpp" label="HPP" type="number" min="0" step="0.01" defaultValue={editingProduct.hpp} required />
              <Field name="hargaJual" label="Harga jual" type="number" min="0" step="0.01" defaultValue={editingProduct.hargaJual} required />
              <Field name="stok" label="Stok aktual" type="number" min="0" max="2147483647" step="1" defaultValue={editingProduct.stok} required />
              <Field name="stokMinimum" label="Batas stok menipis" type="number" min="0" step="1" defaultValue={editingProduct.stokMinimum} required />
              <Field name="alasanStok" label="Alasan perubahan stok (wajib jika berubah)" maxLength="255" placeholder="Contoh: hasil hitung fisik" />
            </div>
            <p className="muted">Perubahan stok dicatat sebagai stock opname. Stok tidak dapat diatur di bawah jumlah batch yang tercatat.</p>
            <button className="button primary icon-button" disabled={busy} aria-label="Simpan perubahan" title="Simpan perubahan"><Icon name="save" /></button>{" "}
            <button type="button" className="button ghost icon-button" onClick={() => setEditingProduct(null)} aria-label="Batal" title="Batal"><Icon name="cancel" /></button>
          </form>}
          <div className="panel"><PanelTitle title={summaryDetail === "lowStock" ? "Produk dengan stok menipis" : "Katalog obat"} count={`${filtered.length} produk`} /><Search value={query} onChange={setQuery} />
            <ProductsTable products={filtered} money={money} onArchive={archiveProduct} onPriceChange={changePrice} onEdit={setEditingProduct} owner={user.role === "PEMILIK"} />
          </div>
        </>}
        {screen === "calculator" && user.role === "PEMILIK" && <>
          <div className="panel product-form">
            <div className="panel-title"><div><h2>Hitung harga jual</h2><p>Persentase admin dan pajak dihitung dari harga jual; biaya lainnya per unit.</p></div></div>
            <div className="form-grid">
              <label>Obat<select name="produkId" value={priceForm.produkId} onChange={changePriceInput} required><option value="" disabled>Pilih obat</option>{data.map((product) => <option value={product.id} key={product.id}>{product.namaProduk}</option>)}</select>{selectedPriceProduct && <small className="cell-sub">Harga beli: {money(selectedPriceProduct.hargaBeli)} · Harga jual saat ini: {money(selectedPriceProduct.hargaJual)}</small>}</label>
              <Field name="hpp" label="HPP" type="number" min="0" step="0.01" value={priceForm.hpp} onChange={changePriceInput} required />
              <Field name="persenBiayaAdmin" label="Biaya admin (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenBiayaAdmin} onChange={changePriceInput} required />
              <Field name="persenPajak" label="Pajak (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenPajak} onChange={changePriceInput} required />
              <Field name="biayaPengemasan" label="Biaya pengemasan" type="number" min="0" step="0.01" value={priceForm.biayaPengemasan} onChange={changePriceInput} required />
              <Field name="biayaLayanan" label="Biaya layanan" type="number" min="0" step="0.01" value={priceForm.biayaLayanan} onChange={changePriceInput} required />
              <Field name="biayaGratisOngkir" label="Subsidi gratis ongkir" type="number" min="0" step="0.01" value={priceForm.biayaGratisOngkir} onChange={changePriceInput} required />
              <Field name="persenTargetLaba" label="Target laba (%)" type="number" min="0" max="99.99" step="0.01" value={priceForm.persenTargetLaba} onChange={changePriceInput} required />
            </div>
            {selectedPriceProduct && <small className="cell-sub">{priceSourceNote}</small>}
            {priceError && <p className="cell-sub" role="alert">{priceError}</p>}
          </div>
          {priceResult && <div className="panel">
            <PanelTitle title="Hasil kalkulasi" count={data.find((item) => item.id === priceDraft?.produkId)?.namaProduk || "Produk"} />
            <div className="price-result"><span>Harga jual saat ini: <b>{money(selectedPriceProduct?.hargaJual)}</b></span><span>Harga jual yang disarankan</span><strong>{money(priceResult.hargaJual)}</strong><span>Laba kotor per unit: <b>{money(priceResult.labaKotor)}</b></span><span>Estimasi laba bersih per unit: <b>{money(priceResult.labaBersih)}</b></span></div>
            <button className="button primary icon-button" disabled={busy || !priceDraft} onClick={saveSuggestedPrice} aria-label={busy ? "Menyimpan" : "Simpan harga ke produk"} title={busy ? "Menyimpan" : "Simpan harga ke produk"}><Icon name="save" /></button>
          </div>}
        </>}
        {screen === "sales" && <div className="sales-layout">
          <div className="panel"><PanelTitle title="Pilih obat" count={`${filtered.length} tersedia`} /><Search value={query} onChange={(value) => { setQuery(value); setSalesPage(1); }} />
            <div className="product-picker">{salesPageProducts.map((product) => <div className="picker-row" key={product.id}><div><b>{product.namaProduk}</b><small>{product.kodeBarang || "Tanpa kode"} · Stok {product.stok} {product.satuan.kode}</small></div><div className="picker-action"><b>{money(product.hargaJual)}</b><button className="button secondary" disabled={!product.stok || busy} onClick={() => setCart((items) => {
              const found = items.find((item) => item.id === product.id);
              if (found) return items.map((item) => item.id === product.id ? { ...item, quantity: Math.min(item.quantity + 1, product.stok) } : item);
              return [...items, { id: product.id, quantity: 1, product }];
            })} aria-label={`Tambah ${product.namaProduk}`} title={`Tambah ${product.namaProduk}`}><Icon name="plus" /></button></div></div>)}
              {!filtered.length && <div className="empty-state">Tidak ada obat yang cocok dengan pencarian.</div>}
            </div>
            {filtered.length > 0 && <div className="sales-pagination">
              <small>Menampilkan {salesPageStart + 1}–{Math.min(salesPageStart + SALES_PAGE_SIZE, filtered.length)} dari {filtered.length} obat</small>
              {salesPageCount > 1 && <div className="sales-page-controls">
                <button type="button" className="button ghost" disabled={activeSalesPage === 1} onClick={() => setSalesPage((page) => Math.max(1, page - 1))}>Sebelumnya</button>
                <span className="sales-page-number">Halaman {activeSalesPage} dari {salesPageCount}</span>
                <button type="button" className="button ghost" disabled={activeSalesPage === salesPageCount} onClick={() => setSalesPage((page) => Math.min(salesPageCount, page + 1))}>Selanjutnya</button>
              </div>}
            </div>}
          </div>
          <div className="panel cart-panel"><PanelTitle title="Keranjang" count={`${cart.reduce((sum, item) => sum + item.quantity, 0)} item`} />
            <div className="cart-items" aria-label="Daftar item keranjang">
              {cart.length ? cart.map((item) => <div className="cart-row" key={item.id}><div><b>{item.product.namaProduk}</b><small>{money(item.product.hargaJual)} × {item.quantity}</small></div><div className="quantity"><button aria-label={`Kurangi ${item.product.namaProduk}`} title={`Kurangi ${item.product.namaProduk}`} onClick={() => setCart((items) => items.map((entry) => entry.id === item.id ? { ...entry, quantity: entry.quantity - 1 } : entry).filter((entry) => entry.quantity > 0))}><Icon name="minus" size={14} /></button><span>{item.quantity}</span><button aria-label={`Tambah ${item.product.namaProduk}`} title={`Tambah ${item.product.namaProduk}`} onClick={() => setCart((items) => items.map((entry) => entry.id === item.id ? { ...entry, quantity: Math.min(entry.quantity + 1, entry.product.stok) } : entry))}><Icon name="plus" size={14} /></button></div></div>) : <div className="empty-state">Pilih obat untuk memulai transaksi.</div>}
            </div>
            <div className="form-grid sale-options">
              <label>Jenis transaksi<select name="jenis" value={saleSettings.jenis} onChange={changeSaleSetting}><option value="OFFLINE">Offline</option><option value="ONLINE">Online</option></select></label>
              <Field name="potongan" label="Potongan transaksi" type="number" min="0" step="0.01" value={saleSettings.potongan} onChange={changeSaleSetting} />
              <Field name="persenBiayaAdmin" label="Admin (%)" type="number" min="0" max="100" step="0.01" value={saleSettings.persenBiayaAdmin} onChange={changeSaleSetting} />
              <Field name="persenPajak" label="Pajak (%)" type="number" min="0" max="100" step="0.01" value={saleSettings.persenPajak} onChange={changeSaleSetting} />
              <Field name="biayaPengemasan" label="Pengemasan / unit" type="number" min="0" step="0.01" value={saleSettings.biayaPengemasan} onChange={changeSaleSetting} />
              <Field name="biayaLayanan" label="Layanan / unit" type="number" min="0" step="0.01" value={saleSettings.biayaLayanan} onChange={changeSaleSetting} />
              <Field name="biayaGratisOngkir" label="Gratis ongkir / unit" type="number" min="0" step="0.01" value={saleSettings.biayaGratisOngkir} onChange={changeSaleSetting} />
            </div>
            <div className="cart-total"><span>Total pembayaran</span><b>{money(Math.max(0, cart.reduce((sum, item) => sum + Number(item.product.hargaJual) * item.quantity, 0) - Number(saleSettings.potongan || 0)))}</b></div>
            <button className="button primary full icon-button" disabled={!cart.length || busy} onClick={checkout} aria-label={busy ? "Memproses transaksi" : "Selesaikan transaksi"} title={busy ? "Memproses transaksi" : "Selesaikan transaksi"}><Icon name="cart" /></button>
          </div>
        </div>}
        {screen === "history" && <div className="panel">
          <div className="panel-title"><div><h2>{summaryDetail === "todayRevenue" ? "Transaksi hari ini" : "Transaksi terbaru"}</h2><p>Transaksi yang disembunyikan tetap diperhitungkan pada stok dan laporan.</p></div><span className="count-pill">{summaryDetail === "todayRevenue" ? `${filtered.length} dari ${dashboard?.todayTransactions ?? filtered.length} transaksi · omzet ${money(dashboard?.todayRevenue)}` : `${filtered.length} transaksi`}</span></div>
          <Search value={query} onChange={setQuery} />
          <SalesTable sales={filtered} money={money} date={date} onReceipt={setReceiptSale} onArchive={user.role === "PEMILIK" ? archiveSale : null} busy={busy} />
        </div>}
        {screen === "expenses" && user.role === "PEMILIK" && <>
          <form className="panel product-form" onSubmit={createExpense}>
            <div className="panel-title"><div><h2>Catat biaya operasional</h2><p>Biaya pada periode ini akan mengurangi laba bersih laporan.</p></div></div>
            <div className="form-grid">
              <Field name="tanggal" label="Tanggal" type="date" value={expenseDate} onChange={(event) => setExpenseDate(event.target.value)} required />
              <Field name="kategori" label="Kategori" maxLength="50" placeholder="Contoh: Listrik" required />
              <Field name="deskripsi" label="Keterangan" maxLength="255" required />
              <Field name="jumlah" label="Jumlah (Rp)" type="number" min="0.01" step="0.01" required />
            </div>
            <button className="button primary icon-button" disabled={busy} aria-label="Simpan biaya" title="Simpan biaya"><Icon name="save" /></button>
          </form>
          <div className="panel"><PanelTitle title="Riwayat biaya operasional" count={`${filtered.length} biaya`} /><Search value={query} onChange={setQuery} /><ExpensesTable expenses={filtered} money={money} date={date} onDelete={deleteExpense} /></div>
        </>}
        {screen === "reports" && user.role === "PEMILIK" && <>
          <form className="panel product-form" onSubmit={refreshReport}>
            <div className="panel-title"><div><h2>Rekapitulasi keuangan</h2><p>Jumlah kunjungan mengikuti banyaknya transaksi berhasil.</p></div></div>
            <div className="form-grid">
              <label>Periode<select value={reportFilter.period} onChange={(event) => setReportFilter((current) => ({ ...current, period: event.target.value }))}><option value="day">Harian</option><option value="month">Bulanan</option><option value="year">Tahunan</option></select></label>
              <label>Tanggal acuan<input type="date" value={reportFilter.date} onChange={(event) => setReportFilter((current) => ({ ...current, date: event.target.value }))} required /></label>
            </div>
            <button className="button primary icon-button" disabled={busy} aria-label={busy ? "Memuat laporan" : "Tampilkan laporan"} title={busy ? "Memuat laporan" : "Tampilkan laporan"}><Icon name="report" /></button>
          </form>
          {report && <>
            <div className="metric-grid report-metrics">
              <Metric label="Omzet" value={money(report.omzet)} note={`${report.jumlahTransaksi} transaksi`} icon="↗" selected={reportDetail === "omzet"} onClick={() => setReportDetail((current) => current === "omzet" ? null : "omzet")} />
              <Metric label="Jumlah kunjungan" value={report.jumlahKunjungan} note="Satu per transaksi tersimpan" icon="♧" selected={reportDetail === "jumlahKunjungan"} onClick={() => setReportDetail((current) => current === "jumlahKunjungan" ? null : "jumlahKunjungan")} />
              <Metric label="Laba kotor" value={money(report.labaKotor)} note="Harga jual dikurangi HPP" icon="+" selected={reportDetail === "labaKotor"} onClick={() => setReportDetail((current) => current === "labaKotor" ? null : "labaKotor")} />
              <Metric label="Biaya operasional" value={money(report.biayaOperasional)} note="Pada periode terpilih" icon="−" warning selected={reportDetail === "biayaOperasional"} onClick={() => setReportDetail((current) => current === "biayaOperasional" ? null : "biayaOperasional")} />
              <Metric label="Laba bersih" value={money(report.labaBersih)} note="Setelah potongan dan biaya" icon="=" selected={reportDetail === "labaBersih"} onClick={() => setReportDetail((current) => current === "labaBersih" ? null : "labaBersih")} />
            </div>
            {reportDetail
              ? <div className="panel">
                <div className="panel-title"><div><h2>Rincian {reportMetricLabels[reportDetail].toLocaleLowerCase("id-ID")}</h2><p>Nilai untuk setiap periode pada laporan ini.</p></div><button type="button" className="button ghost icon-button" onClick={() => setReportDetail(null)} aria-label="Tutup rincian laporan" title="Tutup rincian laporan"><Icon name="cancel" /></button></div>
                <ReportMetricTable rows={report.data} metric={reportDetail} money={money} />
              </div>
              : <div className="panel"><PanelTitle title="Rincian per periode" count={`${report.data.length} baris`} /><ReportTable rows={report.data} money={money} /></div>}
          </>}
        </>}
        {screen === "excel" && user.role === "PEMILIK" && <>
          <div className="panel">
            <div className="panel-title"><div><h2>Ekspor katalog produk</h2><p>Unduh produk aktif sebagai workbook .xlsx untuk arsip atau penyuntingan.</p></div></div>
            <button type="button" className="button primary icon-button" disabled={busy} onClick={exportProductsExcel} aria-label="Unduh produk Excel" title="Unduh produk Excel"><Icon name="download" /></button>
          </div>
          <form className="panel product-form excel-import-form" onSubmit={previewProductsExcel}>
            <div className="panel-title"><div><h2>Impor produk Excel</h2><p>Pratinjau dan perbaiki semua validasi sebelum menyimpan. Stok produk yang sudah ada akan disesuaikan dengan nilai di Excel.</p></div></div>
            <label className="excel-file-picker">
              <span className="excel-file-icon"><Icon name="upload" size={20} /></span>
              <span className="excel-file-copy">
                <strong>{excelFile?.name || "Pilih workbook Excel (.xlsx)"}</strong>
                <small>{excelFile ? "File siap dipratinjau" : "Klik area ini untuk memilih file"}</small>
              </span>
              <span className="excel-file-trigger">{excelFile ? "Ganti file" : "Pilih file"}</span>
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" aria-label="Pilih file workbook Excel" onChange={(event) => {
                setExcelFile(event.target.files?.[0] || null);
                setExcelPreview(null);
                event.target.value = "";
              }} />
            </label>
            <div className="excel-import-help">
              <span className="excel-help-icon" aria-hidden="true">i</span>
              <span><strong>Maksimal 5 MB dan 5.000 baris.</strong> Gunakan urutan kolom workbook ekspor. Stok Excel tidak boleh lebih kecil dari total stok batch yang tercatat.</span>
            </div>
            <div className="excel-import-actions">
              <button className="button primary" disabled={busy || !excelFile}><Icon name="preview" />{busy ? "Memvalidasi…" : "Pratinjau data"}</button>
              <small>Perubahan baru diterapkan setelah Anda menekan Simpan impor.</small>
            </div>
            {excelPreview && <div className="excel-preview">
              {excelPreview.error && <p className="excel-status warning">{excelPreview.error}</p>}
              {excelPreview.mode === "commit"
                ? <p className="excel-status success">Impor berhasil disimpan. Stok {excelPreview.counts?.stokDiperbarui || 0} produk diperbarui.</p>
                : <p className="excel-status warning">Ini baru pratinjau dan belum disimpan. Periksa datanya, lalu klik Simpan impor.</p>}
              <div className="panel-title"><div><h2>{excelPreview.mode === "commit" ? "Hasil impor" : "Hasil pratinjau"}</h2><p>{excelPreview.filename || excelFile?.name} · {excelPreview.rowCount || 0} baris</p></div><span className="count-pill">{excelPreview.counts?.errors || 0} perlu diperbaiki</span></div>
              <div className="excel-summary">
                <span>Produk baru<b>{excelPreview.counts?.create || 0}</b></span>
                <span>Diperbarui<b>{excelPreview.counts?.update || 0}</b></span>
                <span>Stok berubah<b>{excelPreview.counts?.stokDiperbarui || 0}</b></span>
                <span>Ambigu<b>{excelPreview.counts?.ambiguous || 0}</b></span>
              </div>
              {excelPreview.mode !== "commit" && <button type="button" className="button primary excel-save-button" disabled={busy || !excelFile || Boolean(excelPreview.counts?.errors)} onClick={commitProductsExcel}><Icon name="upload" />{busy ? "Menyimpan…" : "Simpan impor"}</button>}
              <ExcelImportTable rows={excelPreview.rows || []} />
            </div>}
          </form>
        </>}
        {screen === "prices" && user.role === "PEMILIK" && <div className="panel"><PanelTitle title="Riwayat harga beli dan jual" count={`${filtered.length} perubahan`} /><Search value={query} onChange={setQuery} /><PriceHistoryTable history={filtered} money={money} date={date} /></div>}
        {screen === "stock" && <>
          <form className="panel stock-form" onSubmit={saveStocktake}>
            <div className="panel-title"><div><h2>Catat stock opname per batch</h2><p>Hitung setiap batch; stok sistem dan batch diperbarui dalam satu transaksi.</p></div></div>
            <div className="form-grid">
              <label>Obat<select name="produkId" required value={stockProductId} onChange={(event) => {
                const productId = event.target.value;
                const product = stockProducts.find((item) => String(item.id) === productId);
                setStockProductId(productId);
                setStockBatchItems((product?.batch || []).filter((batch) => batch.jumlah > 0).map((batch) => ({
                  batchId: batch.id,
                  nomorBatch: batch.nomorBatch,
                  tanggalKedaluwarsa: new Date(batch.tanggalKedaluwarsa).toISOString().slice(0, 10),
                  jumlahFisik: String(batch.jumlah),
                })));
              }}><option value="" disabled>Pilih obat</option>{stockProducts.map((product) => <option value={product.id} key={product.id}>{product.namaProduk} (stok {product.stok})</option>)}</select></label>
              <Field name="alasan" label="Alasan penyesuaian" required />
            </div>
            {stockProductId && <div className="batch-count-list">
              {stockBatchItems.map((item, index) => <div className="form-grid" key={item.batchId || `new-${index}`}>
                {item.batchId ? <label>Batch / kedaluwarsa<input value={`${item.nomorBatch} · ${item.tanggalKedaluwarsa}`} readOnly /></label> : <>
                  <label>Nomor batch<input required maxLength="50" value={item.nomorBatch} onChange={(event) => setStockBatchItems((items) => items.map((entry, itemIndex) => itemIndex === index ? { ...entry, nomorBatch: event.target.value } : entry))} /></label>
                  <label>Kedaluwarsa<input type="date" required value={item.tanggalKedaluwarsa} onChange={(event) => setStockBatchItems((items) => items.map((entry, itemIndex) => itemIndex === index ? { ...entry, tanggalKedaluwarsa: event.target.value } : entry))} /></label>
                </>}
                <label>Jumlah fisik<input type="number" min="0" max="1000000" required value={item.jumlahFisik} onChange={(event) => setStockBatchItems((items) => items.map((entry, itemIndex) => itemIndex === index ? { ...entry, jumlahFisik: event.target.value } : entry))} /></label>
                {!item.batchId && <button type="button" className="button ghost icon-button" onClick={() => setStockBatchItems((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label="Hapus batch" title="Hapus batch"><Icon name="trash" /></button>}
              </div>)}
              {!stockBatchItems.length && <p className="empty-state">Belum ada batch berstok. Tambahkan batch beserta tanggal kedaluwarsa sesuai kemasan fisik.</p>}
              <button type="button" className="button secondary icon-button" onClick={() => setStockBatchItems((items) => [...items, { nomorBatch: "", tanggalKedaluwarsa: "", jumlahFisik: "0" }])} aria-label="Tambah batch fisik" title="Tambah batch fisik"><Icon name="plus" /></button>
            </div>}
            <button className="button primary icon-button" disabled={busy || !stockProductId || !stockBatchItems.length} aria-label="Simpan opname" title="Simpan opname"><Icon name="save" /></button>
          </form>
          <div className="panel"><PanelTitle title="Riwayat stock opname" count={`${filtered.length} catatan`} /><Search value={query} onChange={setQuery} /><StockTable records={filtered} date={date} /></div>
        </>}
        {screen === "expiry" && <>
          <InventoryTabs activeTab="expiry" onSelect={selectInventoryTab} />
          {user.role === "PEMILIK" && !summaryDetail && <form className="panel stock-form" onSubmit={receiveBatch}><div className="panel-title"><div><h2>Terima barang masuk</h2><p>Catat batch baru; jumlahnya otomatis ditambahkan ke stok.</p></div></div><div className="form-grid"><label>Obat<select name="produkId" required defaultValue=""><option value="" disabled>Pilih obat</option>{stockProducts.map((product) => <option value={product.id} key={product.id}>{product.namaProduk}</option>)}</select></label><Field name="nomorBatch" label="Nomor batch" required /><Field name="tanggalKedaluwarsa" label="Tanggal kedaluwarsa" type="date" required /><Field name="jumlah" label="Jumlah diterima" type="number" min="1" required /><Field name="hargaBeli" label="Harga beli terbaru (opsional)" type="number" min="0" step="0.01" /><Field name="hpp" label="HPP terbaru (opsional)" type="number" min="0" step="0.01" /></div><button className="button primary icon-button" disabled={busy} aria-label="Simpan barang masuk" title="Simpan barang masuk"><Icon name="save" /></button></form>}
          <div className="panel"><PanelTitle title="Batch kedaluwarsa dan batas retur" count={`${filtered.length} batch`} /><Search value={query} onChange={setQuery} /><ExpiryTable batches={filtered} date={date} /></div>
        </>}
        {screen === "backup" && user.role === "PEMILIK" && <>
          <div className="panel product-form">
            <div className="panel-title"><div><h2>Backup database</h2><p>File mencakup data pengguna untuk memulihkan akun. Simpan terenkripsi dan jangan bagikan.</p></div></div>
            <button className="button primary icon-button" disabled={busy} onClick={downloadBackup} aria-label={busy ? "Memproses backup" : "Unduh backup JSON"} title={busy ? "Memproses backup" : "Unduh backup JSON"}><Icon name="download" /></button>
          </div>
          <form className="panel product-form restore-form" onSubmit={restoreBackup}>
            <div className="panel-title"><div><h2>Restore database</h2><p>Pulihkan data dari file backup JSON. Proses ini akan mengganti seluruh data yang sedang tersimpan.</p></div></div>
            <div className="restore-warning" role="note">
              <span className="restore-warning-icon" aria-hidden="true">!</span>
              <span className="restore-warning-copy"><strong>Tindakan ini mengganti data saat ini dan tidak dapat dibatalkan.</strong><small>Pastikan file backup benar dan terbaru. Data pengguna, produk, transaksi, dan riwayat akan mengikuti isi backup.</small></span>
            </div>
            <div className="restore-grid">
              <div className="restore-field">
                <p className="restore-field-title">1. Pilih file backup</p>
                <label className="excel-file-picker restore-file-picker">
                  <span className="excel-file-icon"><Icon name="upload" size={20} /></span>
                  <span className="excel-file-copy">
                    <strong>{backupFile?.name || "Pilih file backup JSON"}</strong>
                    <small>{backupFile ? "File dipilih untuk dipulihkan" : "Format .json · maksimal 25 MB"}</small>
                  </span>
                  <span className="excel-file-trigger">{backupFile ? "Ganti file" : "Pilih file"}</span>
                  <input type="file" accept=".json,application/json" aria-label="Pilih file backup JSON" onChange={(event) => {
                    setBackupFile(event.target.files?.[0] || null);
                    setRestoreConfirmation("");
                    event.target.value = "";
                  }} />
                </label>
                {backupFile?.size > 25 * 1024 * 1024 && <small className="restore-file-error">Ukuran file melebihi batas maksimal 25 MB.</small>}
              </div>
              <div className="restore-field">
                <p className="restore-field-title">2. Konfirmasi penggantian data</p>
                <label className="restore-confirm-field">Ketik RESTORE untuk mengaktifkan tombol
                  <input id="restore-confirmation" name="restoreConfirmation" value={restoreConfirmation} onChange={(event) => setRestoreConfirmation(event.target.value)} placeholder="RESTORE" autoComplete="off" autoCapitalize="characters" spellCheck={false} required />
                </label>
                <small className="restore-field-hint">Konfirmasi harus sama persis: RESTORE</small>
              </div>
            </div>
            <button className="button danger restore-submit" disabled={busy || restoreConfirmation !== "RESTORE" || !backupFile || backupFile.size > 25 * 1024 * 1024}>
              <Icon name="restore" />{busy ? "Memulihkan..." : "Pulihkan database"}
            </button>
          </form>
        </>}
        {screen === "users" && user.role === "PEMILIK" && <>
          <form className="panel user-form" onSubmit={createUser}>
            <div className="panel-title"><div><h2>Tambah kasir</h2><p>Sandi disimpan sebagai hash dan tidak bisa dilihat kembali. Anda dapat menampilkan sandi saat mengetiknya.</p></div></div>
            <div className="form-grid">
              <Field name="nama" label="Nama lengkap" required />
              <Field name="username" label="Username" minLength="3" maxLength="50" pattern="[a-zA-Z0-9._-]+" required />
              <PasswordField name="password" label={`Kata sandi (min. ${MIN_PASSWORD_LENGTH} karakter)`} minLength={MIN_PASSWORD_LENGTH} required show={showCreatePassword} onToggle={() => setShowCreatePassword((value) => !value)} />
              <input type="hidden" name="role" value="KASIR" />
            </div>
            <button className="button primary icon-button" disabled={busy} aria-label="Buat pengguna" title="Buat pengguna"><Icon name="user" /></button>
          </form>
          {userEditor && <form className="panel user-form" onSubmit={saveCashier}>
            <div className="panel-title"><div>
              <h2>{userEditor.mode === "edit" ? "Edit data pengguna" : userEditor.mode === "owner-name" ? "Ubah nama pemilik" : "Atur kata sandi pengguna"}</h2>
              <p>{userEditor.mode === "password" ? "Sandi lama tidak dapat ditampilkan. Buat sandi baru untuk menggantinya." : "Perbarui informasi akun."}</p>
            </div></div>
            <div className="form-grid">
              {userEditor.mode === "edit" ? <>
                <Field name="nama" label="Nama lengkap" defaultValue={userEditor.nama} required />
                <Field name="username" label="Username" defaultValue={userEditor.username} minLength="3" maxLength="50" pattern="[a-zA-Z0-9._-]+" required />
              </> : userEditor.mode === "owner-name"
                ? <Field name="nama" label="Nama pemilik" defaultValue={userEditor.nama} required />
                : <PasswordField name="password" label={`Kata sandi baru (min. ${MIN_PASSWORD_LENGTH} karakter)`} minLength={MIN_PASSWORD_LENGTH} required show={showEditorPassword} onToggle={() => setShowEditorPassword((value) => !value)} />}
            </div>
            <div className="user-form-actions">
              <button className="button primary icon-button" disabled={busy} aria-label={userEditor.mode === "edit" ? "Simpan perubahan" : "Perbarui kata sandi"} title={userEditor.mode === "edit" ? "Simpan perubahan" : "Perbarui kata sandi"}><Icon name={userEditor.mode === "edit" ? "save" : "password"} /></button>
              <button type="button" className="button ghost icon-button" onClick={() => setUserEditor(null)} aria-label="Batal" title="Batal"><Icon name="cancel" /></button>
            </div>
          </form>}
          <div className="panel"><PanelTitle title="Pengguna terdaftar" count={`${filtered.length} pengguna`} /><Search value={query} onChange={setQuery} />
            <UsersTable users={filtered} ownerId={user.id} onEdit={openCashierEditor} onToggle={toggleCashier} onDelete={deleteCashier} />
          </div>
        </>}
        {loading && <div className="loading-bar">Memuat data…</div>}
      </main>
      {notice && <div className="toast">{notice}</div>}
    </div>
    {receiptSale && <Receipt
      sale={receiptSale}
      onPrint={() => window.print()}
      onClose={() => setReceiptSale(null)}
    />}
    </>
  );
}

function Field({ name, label, type = "text", ...props }) {
  return <label>{label}<input name={name} type={type} {...props} /></label>;
}

function PasswordField({ name, label, minLength, required, show, onToggle }) {
  const inputId = useId();
  return <div className="password-field">
    <label htmlFor={inputId}>{label}</label>
    <div className="password-input">
      <input id={inputId} name={name} type={show ? "text" : "password"} minLength={minLength} maxLength="200" autoComplete="new-password" required={required} />
      <button type="button" className="button ghost icon-button password-toggle" aria-label={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} title={show ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={show} onClick={onToggle}><Icon name={show ? "eyeOff" : "eye"} /></button>
    </div>
  </div>;
}

function PanelTitle({ title, count }) {
  return <div className="panel-title"><div><h2>{title}</h2><p>Data tersimpan di sistem Apotek Risa.</p></div><span className="count-pill">{count}</span></div>;
}

function Search({ value, onChange }) {
  return <div className="search-wrap"><span>⌕</span><input aria-label="Cari data" placeholder="Cari nama, kode, atau informasi…" value={value} onChange={(event) => onChange(event.target.value)} /></div>;
}

function InventoryTabs({ activeTab, onSelect }) {
  return <nav className="inventory-tabs" aria-label="Bagian obat dan persediaan">
    <button type="button" className={activeTab === "products" ? "selected" : ""} aria-current={activeTab === "products" ? "page" : undefined} onClick={() => onSelect("products")}>Obat</button>
    <button type="button" className={activeTab === "expiry" ? "selected" : ""} aria-current={activeTab === "expiry" ? "page" : undefined} onClick={() => onSelect("expiry")}>Kedaluwarsa</button>
  </nav>;
}

function Dashboard({ dashboard, money: formatMoney, date: formatDate, onMetricClick }) {
  if (!dashboard) return <div className="loading-bar">Memuat ringkasan…</div>;
  return <>
    <div className="metric-grid">
      <Metric label="Omzet hari ini" value={formatMoney(dashboard.todayRevenue)} note={`${dashboard.todayTransactions} transaksi`} icon="↗" onClick={() => onMetricClick("todayRevenue")} />
      <Metric label="Produk aktif" value={dashboard.productCount} note="Jenis obat dalam katalog" icon="▤" onClick={() => onMetricClick("activeProducts")} />
      <Metric label="Stok menipis" value={dashboard.lowStockCount} note="Perlu segera diperiksa" icon="!" warning onClick={() => onMetricClick("lowStock")} />
      <Metric label="Kedaluwarsa ≤ 6 bulan" value={dashboard.expiringCount} note={`≤ 3 bulan: ${dashboard.returnWindowCount} · 3–6 bulan: ${Math.max(0, dashboard.expiringCount - dashboard.returnWindowCount)}`} icon="◷" warning onClick={() => onMetricClick("expiring")} />
    </div>
    <div className="dashboard-grid">
      <div className="panel"><PanelTitle title="Transaksi terkini" count="Terbaru" /><SalesTable sales={dashboard.recentSales} money={formatMoney} date={formatDate} /></div>
      <div className="panel"><PanelTitle title="Stok perlu perhatian" count={`${dashboard.lowStockProducts.length} obat`} />
        {dashboard.lowStockProducts.length ? dashboard.lowStockProducts.map((product) => <div className="attention-row" key={product.id}><span className="attention-icon">!</span><div><b>{product.namaProduk}</b><small>{product.stok} {product.satuan.kode} tersedia · minimum {product.stokMinimum}</small></div></div>) : <div className="empty-state">Semua stok berada di atas batas minimum.</div>}
      </div>
    </div>
  </>;
}

function Metric({ label, value, note, icon, warning, onClick, selected }) {
  return <button type="button" className={`metric-card ${selected ? "selected" : ""}`} onClick={onClick} aria-pressed={Boolean(selected)} aria-label={`${label}: ${value}. Klik untuk melihat detail.`}><div className={`metric-icon ${warning ? "warning" : ""}`}>{icon}</div><span>{label}</span><strong>{value}</strong><small>{note}</small><small className="metric-card-action">Klik untuk lihat detail</small></button>;
}

function ProductsTable({ products, money: formatMoney, onArchive, onPriceChange, onEdit, owner }) {
  return <div className="table-wrap"><table><thead><tr><th>OBAT</th><th>KATEGORI</th><th>HPP</th><th>HARGA JUAL</th><th>STOK</th><th>STATUS</th>{owner && <th />}</tr></thead><tbody>
    {products.map((product) => <tr key={product.id}><td><b>{product.namaProduk}</b><small className="cell-sub">{product.kodeBarang || "Tanpa kode"} · {product.satuan.kode}</small></td><td>{product.kategori.nama}</td><td>{formatMoney(product.hpp)}</td><td>{formatMoney(product.hargaJual)} {owner && <button type="button" className="icon-button text-button" onClick={() => onPriceChange(product)} aria-label={`Ubah harga ${product.namaProduk}`} title={`Ubah harga ${product.namaProduk}`}><Icon name="price" /></button>}</td><td>{product.stok}</td><td><span className={`badge ${product.stok <= product.stokMinimum ? "badge-warning" : ""}`}>{product.stok <= product.stokMinimum ? "Menipis" : "Tersedia"}</span></td>{owner && <td><div className="table-actions"><button type="button" className="icon-button text-button" onClick={() => onEdit(product)} aria-label={`Edit ${product.namaProduk}`} title={`Edit ${product.namaProduk}`}><Icon name="edit" /></button><button type="button" className="icon-button text-button" onClick={() => onArchive(product.id)} aria-label={`Arsipkan ${product.namaProduk}`} title={`Arsipkan ${product.namaProduk}`}><Icon name="archive" /></button></div></td>}</tr>)}
    {!products.length && <EmptyRow colSpan={owner ? 7 : 6} />}
  </tbody></table></div>;
}

function SalesTable({ sales, money: formatMoney, date: formatDate, onReceipt, onArchive, busy = false }) {
  const columnCount = 6 + Number(Boolean(onReceipt)) + Number(Boolean(onArchive));
  return <div className="table-wrap"><table><thead><tr><th>NO. TRANSAKSI</th><th>TANGGAL</th><th>JENIS</th><th>KASIR</th><th>ITEM</th><th>TOTAL</th>{onReceipt && <th>STRUK</th>}{onArchive && <th>AKSI</th>}</tr></thead><tbody>
    {sales.map((sale) => <tr key={sale.id}><td><b>{sale.kodeTransaksi}</b></td><td>{formatDate(sale.tanggal)}</td><td>{sale.jenis === "ONLINE" ? "Online" : "Offline"}</td><td>{sale.user?.nama || "—"}</td><td>{sale.detail?.reduce((sum, detail) => sum + detail.jumlah, 0) ?? 0}</td><td><b>{formatMoney(sale.total)}</b></td>{onReceipt && <td><button type="button" className="icon-button text-button" onClick={() => onReceipt(sale)} aria-label={`Lihat struk ${sale.kodeTransaksi}`} title={`Lihat struk ${sale.kodeTransaksi}`}><Icon name="print" /></button></td>}{onArchive && <td><button type="button" className="icon-button text-button" disabled={busy} onClick={() => onArchive(sale)} aria-label={`Sembunyikan transaksi ${sale.kodeTransaksi}`} title="Sembunyikan dari riwayat"><Icon name="archive" /></button></td>}</tr>)}
    {!sales.length && <EmptyRow colSpan={columnCount} />}
  </tbody></table></div>;
}

function Receipt({ sale, onPrint, onClose }) {
  const details = sale.detail || [];
  const subtotal = details.reduce((sum, item) => sum + Number(item.subtotal), 0);
  const otherFees = Number(sale.biayaAdmin || 0)
    + Number(sale.biayaPengemasan || 0)
    + Number(sale.biayaLayanan || 0)
    + Number(sale.biayaGratisOngkir || 0);
  const transactionDate = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(new Date(sale.tanggal));

  return <div className="receipt-overlay" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
    <div className="receipt-dialog">
      <div className="receipt-actions">
        <button type="button" className="button primary icon-button" onClick={onPrint} aria-label="Cetak struk" title="Cetak struk"><Icon name="print" /></button>
        <button type="button" className="button ghost icon-button" onClick={onClose} aria-label="Tutup struk" title="Tutup struk"><Icon name="cancel" /></button>
      </div>
      <article className="receipt-paper">
        <header className="receipt-header">
          <Image src="/apotek.jpg" alt="Logo Apotek Risa" width={72} height={72} />
          <div className="receipt-header-copy">
            <h2 id="receipt-title">APOTEK RISA</h2>
            <p>JL. TEROPONG PERUM GRIYA<br />MASMUR 1 BLOK B KAVLING NO 7</p>
            <p>Telp: 0882-7145-7114</p>
          </div>
        </header>
        <div className="receipt-meta">
          <div><span>No. Transaksi</span><span aria-hidden="true">:</span><b>{sale.kodeTransaksi}</b></div>
          <div><span>Tanggal</span><span aria-hidden="true">:</span><b>{transactionDate}</b></div>
          <div><span>Pelanggan</span><span aria-hidden="true">:</span><b>UMUM</b></div>
        </div>
        <section className="receipt-lines" aria-label="Rincian item">
          <h3>Item</h3>
          {details.map((item) => <div className="receipt-item" key={item.id}>
            <b className="receipt-item-name">{item.produk?.namaProduk || "Produk tidak tersedia"}</b>
            <div className="receipt-item-price">
              <span>{item.jumlah} {item.produk?.satuan?.kode || ""} x {receiptNumber.format(Number(item.hargaSatuan || 0))}</span>
              <b>{receiptNumber.format(Number(item.subtotal || 0))}</b>
            </div>
          </div>)}
        </section>
        <div className="receipt-summary">
          <span>Subtotal</span><b>{receiptNumber.format(subtotal)}</b>
          <span>Potongan</span><b>{receiptNumber.format(Number(sale.potongan || 0))}</b>
          <span>Pajak</span><b>{receiptNumber.format(Number(sale.biayaPajak || 0))}</b>
          <span>Biaya Lain</span><b>{receiptNumber.format(otherFees)}</b>
          <hr className="receipt-total-divider" />
          <strong>TOTAL</strong><strong>{receiptNumber.format(Number(sale.total || 0))}</strong>
        </div>
        <p className="receipt-thanks">Terima kasih atas<br />kunjungan Anda</p>
      </article>
    </div>
  </div>;
}

function StockTable({ records, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>OBAT / RINCIAN BATCH</th><th>STOK SISTEM</th><th>STOK FISIK</th><th>SELISIH</th><th>PETUGAS</th></tr></thead><tbody>
    {records.map((record) => <tr key={record.id}><td>{formatDate(record.tanggal)}</td><td><b>{record.produk.namaProduk}</b><small className="cell-sub">{record.alasan}</small>{record.detailBatch?.map((item) => <small className="cell-sub" key={item.id}>{item.nomorBatch} · {item.jumlahSebelum} → {item.jumlahFisik}</small>)}</td><td>{record.stokSistem}</td><td>{record.stokFisik}</td><td><span className={`badge ${record.selisih < 0 ? "badge-warning" : ""}`}>{record.selisih > 0 ? "+" : ""}{record.selisih}</span></td><td>{record.user.nama}</td></tr>)}
    {!records.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function ExpiryTable({ batches, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>OBAT</th><th>NO. BATCH</th><th>KEDALUWARSA</th><th>SISA STOK</th><th>STATUS</th></tr></thead><tbody>
    {batches.map((batch) => <tr key={batch.id}><td><b>{batch.produk?.namaProduk || "Produk tidak tersedia"}</b></td><td>{batch.nomorBatch}</td><td>{formatDate(batch.tanggalKedaluwarsa)}</td><td>{batch.jumlah}</td><td><span className="badge badge-warning">{batch.status === "KEDALUWARSA" ? "Kedaluwarsa" : batch.status === "BATAS_RETUR" ? "Batas retur ≤ 3 bulan" : "Preventif ≤ 6 bulan"}</span></td></tr>)}
    {!batches.length && <EmptyRow colSpan={5} />}
  </tbody></table></div>;
}

function UsersTable({ users, ownerId, onEdit, onToggle, onDelete }) {
  return <div className="table-wrap"><table><thead><tr><th>NAMA</th><th>USERNAME</th><th>PERAN</th><th>STATUS</th><th>DIBUAT</th><th>AKSI</th></tr></thead><tbody>
    {users.map((item) => <tr key={item.id}><td><b>{item.nama}</b></td><td>{item.username}</td><td>{item.role === "PEMILIK" ? "Pemilik" : "Kasir"}</td><td><span className={`badge ${item.aktif ? "" : "badge-warning"}`}>{item.aktif ? "Aktif" : "Nonaktif"}</span></td><td>{new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.dibuatPada))}</td><td>{item.role === "KASIR" ? <div className="table-actions"><button className="icon-button text-button" onClick={() => onEdit(item, "edit")} aria-label={`Edit ${item.nama}`} title={`Edit ${item.nama}`}><Icon name="edit" /></button><button className="icon-button text-button" onClick={() => onEdit(item, "password")} aria-label={`Atur sandi ${item.nama}`} title={`Atur sandi ${item.nama}`}><Icon name="password" /></button><button className="icon-button text-button" onClick={() => onToggle(item)} aria-label={item.aktif ? `Arsipkan ${item.nama}` : `Aktifkan ${item.nama}`} title={item.aktif ? `Arsipkan ${item.nama}` : `Aktifkan ${item.nama}`}><Icon name={item.aktif ? "archive" : "user"} /></button><button className="icon-button text-button" onClick={() => onDelete(item)} aria-label={`Hapus ${item.nama}`} title={`Hapus ${item.nama}`}><Icon name="trash" /></button></div> : item.id === ownerId && <div className="table-actions"><button className="icon-button text-button" onClick={() => onEdit(item, "owner-name")} aria-label="Ubah nama pemilik" title="Ubah nama pemilik"><Icon name="edit" /></button><button className="icon-button text-button" onClick={() => onEdit(item, "password")} aria-label="Atur sandi pemilik" title="Atur sandi pemilik"><Icon name="password" /></button></div>}</td></tr>)}
    {!users.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function PriceHistoryTable({ history, money: formatMoney, date: formatDate }) {
  return <div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>OBAT</th><th>JENIS</th><th>HARGA LAMA</th><th>HARGA BARU</th><th>DIUBAH OLEH</th></tr></thead><tbody>
    {history.map((item) => <tr key={item.id}><td>{formatDate(item.tanggal)}</td><td><b>{item.produk.namaProduk}</b><small className="cell-sub">{item.produk.kodeBarang || "Tanpa kode"}</small></td><td>{item.jenisHarga === "JUAL" ? "Harga jual" : item.jenisHarga === "HPP" ? "HPP" : "Harga beli"}</td><td>{formatMoney(item.hargaLama)}</td><td><b>{formatMoney(item.hargaBaru)}</b></td><td>{item.user.nama}</td></tr>)}
    {!history.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function EmptyRow({ colSpan }) {
  return <tr><td colSpan={colSpan} className="empty-cell">Belum ada data untuk ditampilkan.</td></tr>;
}

function ExpensesTable({ expenses, money: formatMoney, date: formatDate, onDelete }) {
  return <div className="table-wrap"><table><thead><tr><th>TANGGAL</th><th>KATEGORI</th><th>KETERANGAN</th><th>JUMLAH</th><th>DICATAT OLEH</th><th>AKSI</th></tr></thead><tbody>
    {expenses.map((expense) => <tr key={expense.id}><td>{formatDate(expense.tanggal)}</td><td>{expense.kategori}</td><td>{expense.deskripsi}</td><td><b>{formatMoney(expense.jumlah)}</b></td><td>{expense.user?.nama || "—"}</td><td><button className="icon-button text-button" onClick={() => onDelete(expense)} aria-label={`Hapus biaya ${expense.deskripsi}`} title={`Hapus biaya ${expense.deskripsi}`}><Icon name="trash" /></button></td></tr>)}
    {!expenses.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function reportPeriodLabel(period) {
  const value = new Date(`${period.length === 7 ? `${period}-01` : period}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("id-ID", {
    ...(period.length === 7 ? { month: "long", year: "numeric" } : { dateStyle: "medium" }),
    timeZone: "UTC",
  }).format(value);
}

function ReportTable({ rows, money: formatMoney }) {
  return <div className="table-wrap"><table><thead><tr><th>PERIODE</th><th>OMZET</th><th>TRANSAKSI / KUNJUNGAN</th><th>LABA KOTOR</th><th>BIAYA OPERASIONAL</th><th>LABA BERSIH</th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.periode}><td>{reportPeriodLabel(row.periode)}</td><td>{formatMoney(row.omzet)}</td><td>{row.jumlahTransaksi} / {row.jumlahKunjungan}</td><td>{formatMoney(row.labaKotor)}</td><td>{formatMoney(row.biayaOperasional)}</td><td><b>{formatMoney(row.labaBersih)}</b></td></tr>)}
    {!rows.length && <EmptyRow colSpan={6} />}
  </tbody></table></div>;
}

function ReportMetricTable({ rows, metric, money: formatMoney }) {
  const countMetric = metric === "jumlahKunjungan";
  return <div className="table-wrap"><table><thead><tr><th>PERIODE</th><th>{reportMetricLabels[metric].toLocaleUpperCase("id-ID")}</th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.periode}><td>{reportPeriodLabel(row.periode)}</td><td><b>{countMetric ? row[metric] : formatMoney(row[metric])}</b></td></tr>)}
    {!rows.length && <EmptyRow colSpan={2} />}
  </tbody></table></div>;
}

function ExcelImportTable({ rows }) {
  const actionLabels = { create: "Baru", update: "Perbarui", ambiguous: "Ambigu", invalid: "Tidak valid" };
  return <div className="table-wrap"><table><thead><tr><th>BARIS</th><th>KODE</th><th>NAMA PRODUK</th><th>STOK SAAT INI</th><th>STOK EXCEL</th><th>AKSI</th><th>VALIDASI</th></tr></thead><tbody>
    {rows.map((row) => <tr key={row.row}><td>{row.row}</td><td>{row.product?.kodeBarang || "—"}</td><td>{row.product?.namaProduk || "—"}</td><td>{row.action === "update" ? row.stokSebelum : "—"}</td><td>{row.product?.stok ?? "—"}</td><td>{actionLabels[row.action] || row.action}</td><td>{row.errors.length ? row.errors.join("; ") : "Siap disimpan"}</td></tr>)}
    {!rows.length && <EmptyRow colSpan={7} />}
  </tbody></table></div>;
}
